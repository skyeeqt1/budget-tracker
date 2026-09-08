import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ConfirmModal from "@/components/ConfirmModal";
import ProgressBar from "@/components/ProgressBar";
import TransactionItem from "@/components/TransactionItem";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { generateBudgetPdf } from "@/lib/generatePdf";
import {
  computeSummary,
  currentSheet,
  expensesForSheet,
  sortNewest,
  useBudgetStore,
} from "@/store/useBudgetStore";
import { BudgetSheet, BudgetSummary, Expense } from "@/types";

export default function HistoryScreen() {
  const sheets = useBudgetStore((s) => s.sheets);
  const allExpenses = useBudgetStore((s) => s.expenses);

  // Sheets whose expense list is expanded. Everything starts collapsed.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // PDF export state
  const [exportTarget, setExportTarget] = useState<{
    sheet: BudgetSheet;
    summary: BudgetSummary;
    expenses: Expense[];
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const pastSheets = useMemo(() => {
    const active = currentSheet(sheets);
    return sheets
      .filter((s) => s.id !== active?.id)
      .sort(
        (a, b) =>
          b.startDate.localeCompare(a.startDate) || b.createdAt - a.createdAt
      );
  }, [sheets]);

  const groups = useMemo(
    () =>
      pastSheets.map((sheet) => {
        const sheetExpenses = expensesForSheet(allExpenses, sheet);
        return {
          sheet,
          summary: computeSummary(sheet.budget, sheetExpenses),
          expenses: sortNewest(sheetExpenses),
        };
      }),
    [pastSheets, allExpenses]
  );

  const hasAnySheet = sheets.length > 0;

  const handleLongPress = (
    sheet: BudgetSheet,
    summary: BudgetSummary,
    expenses: Expense[]
  ) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setExportTarget({ sheet, summary, expenses });
  };

  const handleExportConfirm = async () => {
    if (!exportTarget) return;
    setExporting(true);
    try {
      await generateBudgetPdf(exportTarget);
    } catch {
      Alert.alert("Export Failed", "Could not generate the PDF. Please try again.");
    } finally {
      setExporting(false);
      setExportTarget(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FF" }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-5 pb-4 pt-3">
          <Text className="text-[26px] font-bold tracking-tight text-ink-900">
            History
          </Text>
          <Text className="mt-0.5 text-[14px] text-ink-400">
            {pastSheets.length === 0
              ? "Your closed budgets will appear here"
              : `${pastSheets.length} closed budget${
                  pastSheets.length === 1 ? "" : "s"
                }`}
          </Text>
          {pastSheets.length > 0 && (
            <Text className="mt-1 text-[12px] text-ink-400">
              Long press a record to export as PDF
            </Text>
          )}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          {pastSheets.length === 0 ? (
            <View className="items-center rounded-3xl bg-white px-6 py-16">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-ink-100">
                <Ionicons name="layers-outline" size={26} color="#94a3b8" />
              </View>
              <Text className="text-[15px] font-semibold text-ink-700">
                {hasAnySheet ? "No past budgets yet" : "No budget sheets yet"}
              </Text>
              <Text className="mt-1 text-center text-[13px] text-ink-400">
                {hasAnySheet
                  ? "When you start a new budget, the previous one will show up here for review."
                  : "Create your first budget to start tracking expenses."}
              </Text>
            </View>
          ) : (
            <>
              {groups.map(({ sheet, summary, expenses }) => {
                const expanded = expandedIds.has(sheet.id);
                return (
                  <Pressable
                    key={sheet.id}
                    onLongPress={() => handleLongPress(sheet, summary, expenses)}
                    delayLongPress={500}
                    accessibilityRole="button"
                    accessibilityLabel={`Budget record ${formatDateShort(sheet.startDate)} to ${formatDateShort(sheet.endDate)}. Long press to export as PDF.`}
                    className="mb-5 overflow-hidden rounded-3xl bg-white"
                  >
                    {/* Summary header */}
                    <View className="px-4 pb-3 pt-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-1 text-[15px] font-bold text-ink-900">
                          {formatDateShort(sheet.startDate)} -{" "}
                          {formatDateShort(sheet.endDate)}
                        </Text>
                        <Pressable
                          onPress={() => toggleExpanded(sheet.id)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={
                            expanded ? "Hide expenses" : "Show expenses"
                          }
                          className="ml-2 shrink-0 flex-row items-center rounded-full bg-ink-100 px-3 py-1.5"
                        >
                          <Text className="mr-1 text-[12px] font-semibold text-ink-600">
                            {expenses.length}
                          </Text>
                          <Ionicons
                            name={expanded ? "chevron-up" : "chevron-down"}
                            size={14}
                            color="#64748b"
                          />
                        </Pressable>
                      </View>
                      <Text className="mt-1 text-[13px] text-ink-400">
                        {formatCurrency(summary.budget)} budget ·{" "}
                        {formatCurrency(summary.spent)} spent
                      </Text>
                      <View className="mt-2">
                        <ProgressBar
                          progress={summary.ratio}
                          barColor={
                            summary.overBudget
                              ? "#fb7185"
                              : summary.ratio >= 0.75
                                ? "#fbbf24"
                                : "#34d399"
                          }
                          trackColor="#E2E0ED"
                          height={6}
                        />
                      </View>
                      <Text
                        className={`mt-1.5 text-[13px] font-semibold ${
                          summary.overBudget
                            ? "text-rose-500"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatCurrency(summary.remaining)}{" "}
                        {summary.overBudget ? "over" : "left"}
                      </Text>
                    </View>

                    {/* Expenses (collapsed by default) */}
                    {expanded && (
                      <View className="border-t border-ink-100 px-4 py-1">
                        {expenses.length === 0 ? (
                          <Text className="py-6 text-center text-[13px] text-ink-400">
                            No expenses in this period.
                          </Text>
                        ) : (
                          expenses.map((expense) => (
                            <TransactionItem
                              key={expense.id}
                              expense={expense}
                              showDate
                            />
                          ))
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <ConfirmModal
        visible={exportTarget !== null}
        title="Export as PDF"
        message="Save this budget record as a PDF file to share or print."
        confirmLabel={exporting ? "Exporting..." : "Export"}
        confirmDisabled={exporting}
        onCancel={() => setExportTarget(null)}
        onConfirm={handleExportConfirm}
      />
    </View>
  );
}