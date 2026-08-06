import Ionicons from "@expo/vector-icons/Ionicons";
import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TransactionItem from "@/components/TransactionItem";
import { formatCurrency, formatDateShort } from "@/lib/format";
import {
  computeSummary,
  currentSheet,
  expensesForSheet,
  sortNewest,
  useBudgetStore,
} from "@/store/useBudgetStore";

export default function HistoryScreen() {
  const sheets = useBudgetStore((s) => s.sheets);
  const allExpenses = useBudgetStore((s) => s.expenses);

  const pastSheets = useMemo(() => {
    const active = currentSheet(sheets);
    return sheets
      .filter((s) => s.id !== active?.id)
      .sort(
        (a, b) =>
          b.startDate.localeCompare(a.startDate) || b.createdAt - a.createdAt
      );
  }, [sheets]);

  const hasAnySheet = sheets.length > 0;

  return (
    <View className="flex-1 bg-ink-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="px-5 pb-4 pt-3">
          <Text className="text-[26px] font-bold tracking-tight text-ink-900">
            History
          </Text>
          <Text className="mt-0.5 text-[14px] text-ink-400">
            {pastSheets.length} past budget sheet(s)
          </Text>
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
            pastSheets.map((sheet) => {
              const sheetExpenses = expensesForSheet(allExpenses, sheet);
              const summary = computeSummary(sheet.budget, sheetExpenses);
              const expenses = sortNewest(sheetExpenses);
              return (
                <View key={sheet.id} className="mb-5">
                  <View className="mb-1.5 px-1">
                    <Text className="text-[15px] font-bold text-ink-900">
                      {formatDateShort(sheet.startDate)} -{" "}
                      {formatDateShort(sheet.endDate)}
                    </Text>
                    <Text className="mt-0.5 text-[13px] text-ink-400">
                      {formatCurrency(summary.budget)} budget ·{" "}
                      {formatCurrency(summary.spent)} spent
                    </Text>
                    <Text
                      className={`text-[13px] font-semibold ${
                        summary.overBudget ? "text-rose-500" : "text-emerald-600"
                      }`}
                    >
                      {formatCurrency(summary.remaining)}{" "}
                      {summary.overBudget ? "over" : "left"}
                    </Text>
                  </View>

                  <View className="rounded-3xl bg-white px-4 py-2">
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
                </View>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}