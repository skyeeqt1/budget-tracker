import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ConfirmModal from "@/components/ConfirmModal";
import ProgressBar from "@/components/ProgressBar";
import SuccessToast from "@/components/SuccessToast";
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
import { useThemeStore } from "@/store/useThemeStore";
import { BudgetSheet, BudgetSummary, Expense } from "@/types";

export default function HistoryScreen() {
  const sheets = useBudgetStore((s) => s.sheets);
  const allExpenses = useBudgetStore((s) => s.expenses);
  const { theme } = useThemeStore();

  // Sheets whose expense list is expanded. Everything starts collapsed.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // PDF export state
  const [exportTarget, setExportTarget] = useState<{
    sheet: BudgetSheet;
    summary: BudgetSummary;
    expenses: Expense[];
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toastFile, setToastFile] = useState<string | null>(null);

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

  const handleExportPress = (
    sheet: BudgetSheet,
    summary: BudgetSummary,
    expenses: Expense[]
  ) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setExportTarget({ sheet, summary, expenses });
  };

  const handleExportConfirm = async () => {
    if (!exportTarget) return;
    setExporting(true);
    try {
      const fileName = await generateBudgetPdf(exportTarget);
      if (fileName) setToastFile(fileName);
    } catch {
      Alert.alert("Export Failed", "Could not generate the PDF. Please try again.");
    } finally {
      setExporting(false);
      setExportTarget(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-5 pb-4 pt-3">
          <Text className="text-[26px] font-bold tracking-tight" style={{ color: theme.text }}>
            History
          </Text>
          <Text className="mt-0.5 text-[14px]" style={{ color: theme.muted }}>
            {pastSheets.length === 0
              ? "Your closed budgets will appear here"
              : `${pastSheets.length} closed budget${
                  pastSheets.length === 1 ? "" : "s"
                }`}
          </Text>
          {pastSheets.length > 0 && (
            <Text className="mt-1 text-[12px]" style={{ color: theme.muted }}>
              Tap the document icon to export a record as PDF
            </Text>
          )}
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-10"
          showsVerticalScrollIndicator={false}
        >
          {pastSheets.length === 0 ? (
            <View className="items-center rounded-3xl px-6 py-16" style={{ backgroundColor: theme.secondary }}>
              <View
                className="mb-3 h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.subtle }}
              >
                <Ionicons name="layers-outline" size={26} color={theme.muted} />
              </View>
              <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>
                {hasAnySheet ? "No past budgets yet" : "No budget sheets yet"}
              </Text>
              <Text className="mt-1 text-center text-[13px]" style={{ color: theme.muted }}>
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
                  <View
                    key={sheet.id}
                    className="mb-5 overflow-hidden rounded-3xl"
                    style={{ backgroundColor: theme.secondary }}
                  >
                    {/* Summary header */}
                    <View className="px-4 pb-3 pt-4">
                      <View className="flex-row items-center justify-between">
                        <Text className="flex-1 text-[15px] font-bold" style={{ color: theme.text }}>
                          {formatDateShort(sheet.startDate)} -{" "}
                          {formatDateShort(sheet.endDate)}
                        </Text>
                        <View className="ml-2 shrink-0 flex-row items-center">
                          <Pressable
                            onPress={() => handleExportPress(sheet, summary, expenses)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Export as PDF"
                            style={{ backgroundColor: `${theme.primary}20` }}
                            className="mr-2 h-8 w-8 items-center justify-center rounded-full"
                          >
                            <Ionicons name="document-text-outline" size={15} color={theme.primary} />
                          </Pressable>
                          <Pressable
                            onPress={() => toggleExpanded(sheet.id)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={
                              expanded ? "Hide expenses" : "Show expenses"
                            }
                            className="flex-row items-center rounded-full px-3 py-1.5"
                            style={{ backgroundColor: theme.subtle }}
                          >
                            <Text
                              className="mr-1 text-[12px] font-semibold"
                              style={{ color: theme.text }}
                            >
                              {expenses.length}
                            </Text>
                            <Ionicons
                              name={expanded ? "chevron-up" : "chevron-down"}
                              size={14}
                              color={theme.muted}
                            />
                          </Pressable>
                        </View>
                      </View>
                      <Text className="mt-1 text-[13px]" style={{ color: theme.muted }}>
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
                          trackColor={theme.border}
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
                      <View
                        className="border-t px-4 py-1"
                        style={{ borderTopColor: theme.border }}
                      >
                        {expenses.length === 0 ? (
                          <Text
                            className="py-6 text-center text-[13px]"
                            style={{ color: theme.muted }}
                          >
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
                  </View>
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
        loading={exporting}
        onCancel={() => setExportTarget(null)}
        onConfirm={handleExportConfirm}
      />

      <SuccessToast
        visible={toastFile !== null}
        title="Export Successful"
        message={toastFile ? `Saved as ${toastFile}` : ""}
        onHidden={() => setToastFile(null)}
      />
    </View>
  );
}