import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddExpenseModal from "@/components/AddExpenseModal";
import BudgetModal from "@/components/BudgetModal";
import ProgressBar from "@/components/ProgressBar";
import TransactionItem from "@/components/TransactionItem";
import {
  formatCurrency,
  formatDateRange,
} from "@/lib/format";
import { sortNewest, useActiveSheet, useBudgetStore } from "@/store/useBudgetStore";

export default function DashboardScreen() {
  const { sheet, summary, periodExpenses } = useActiveSheet();
  const deleteExpense = useBudgetStore((s) => s.deleteExpense);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetMode, setBudgetMode] = useState<"create" | "edit">("create");

  const recent = useMemo(() => sortNewest(periodExpenses).slice(0, 5), [periodExpenses]);

  const handleDelete = (id: string) => {
    Alert.alert("Delete expense", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteExpense(id) },
    ]);
  };

  const hasSheet = !!sheet && !!summary;
  const barColor = !hasSheet
    ? "#a5b4fc"
    : summary.overBudget
      ? "#fb7185"
      : summary.ratio >= 0.75
        ? "#fbbf24"
        : "#34d399";

  const openBudgetModal = (mode: "create" | "edit") => {
    setBudgetMode(mode);
    setBudgetModalVisible(true);
  };

  return (
    <View className="flex-1 bg-ink-50">
      <SafeAreaView edges={["top"]} className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-28 pt-3"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="text-[26px] font-bold tracking-tight text-ink-900">
                Budget
              </Text>
              {sheet && (
                <Text className="mt-0.5 text-[14px] text-ink-400">
                  {formatDateRange(sheet.startDate, sheet.endDate)}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => openBudgetModal("create")}
              className="flex-row items-center rounded-2xl bg-indigo-600 px-4 py-3"
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text className="ml-1 text-[14px] font-bold text-white">
                New Budget
              </Text>
            </Pressable>
          </View>

          {/* Hero budget card */}
          {hasSheet && summary ? (
            <LinearGradient
              colors={["#4f46e5", "#3730a3"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="mb-5 rounded-3xl p-6"
            >
              <View className="mb-1 flex-row items-center justify-between">
                <Text className="text-[13px] font-medium text-indigo-200">
                  Active Budget
                </Text>
                <Pressable
                  onPress={() => sheet && openBudgetModal("edit")}
                  hitSlop={8}
                  className="flex-row items-center rounded-full px-3 py-1.5"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                >
                  <Ionicons name="pencil" size={12} color="#e0e7ff" />
                  <Text className="ml-1.5 text-[12px] font-semibold text-indigo-100">
                    Edit
                  </Text>
                </Pressable>
              </View>
              <Text className="mb-5 text-[13px] text-indigo-200">
                {formatDateRange(sheet.startDate, sheet.endDate)}
              </Text>

              <Text className="mb-5 text-[34px] font-bold tracking-tight text-white">
                {formatCurrency(summary.remaining)}
              </Text>

              <ProgressBar
                progress={summary.ratio}
                barColor={barColor}
                trackColor="rgba(255,255,255,0.25)"
                height={10}
              />

              <View className="mt-3 flex-row justify-between">
                <View>
                  <Text className="text-[12px] text-indigo-200">Spent</Text>
                  <Text className="text-[16px] font-semibold text-white">
                    {formatCurrency(summary.spent)}
                  </Text>
                </View>
                <View>
                  <Text className="text-[12px] text-indigo-200">Total Budget</Text>
                  <Text className="text-[16px] font-semibold text-white">
                    {formatCurrency(summary.budget)}
                  </Text>
                </View>
              </View>

              {summary.overBudget && (
                <View
                  className="mt-4 flex-row items-center rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "rgba(244,63,94,0.2)" }}
                >
                  <Ionicons name="alert-circle" size={16} color="#fda4af" />
                  <Text className="ml-2 flex-1 text-[13px] font-medium text-rose-200">
                    You have exceeded your budget.
                  </Text>
                </View>
              )}
            </LinearGradient>
          ) : (
            <View className="mb-5 items-center rounded-3xl bg-white px-6 py-10">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                <Ionicons name="wallet-outline" size={26} color="#4f46e5" />
              </View>
              <Text className="text-[17px] font-bold text-ink-900">
                No active budget
              </Text>
              <Text className="mt-1 text-center text-[13px] text-ink-400">
                Set a budget and pick your start & end dates to begin.
              </Text>
              <Pressable
                onPress={() => openBudgetModal("create")}
                className="mt-5 items-center rounded-2xl bg-indigo-600 px-8 py-3.5"
              >
                <Text className="text-[15px] font-bold text-white">
                  Set Up Budget
                </Text>
              </Pressable>
            </View>
          )}

          {/* Recent transactions */}
          <Text className="mb-4 text-[18px] font-bold text-ink-900">
            Recent Transactions
          </Text>

          <View className="rounded-3xl bg-white px-4 py-2">
            {recent.length === 0 ? (
              <View className="items-center py-10">
                <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-ink-100">
                  <Ionicons name="receipt-outline" size={26} color="#94a3b8" />
                </View>
                <Text className="text-[15px] font-semibold text-ink-700">
                  No expenses yet
                </Text>
                <Text className="mt-1 text-center text-[13px] text-ink-400">
                  Tap the + button below to record{"\n"}your first transaction.
                </Text>
              </View>
            ) : (
              recent.map((expense) => (
                <TransactionItem
                  key={expense.id}
                  expense={expense}
                  onDelete={handleDelete}
                />
              ))
            )}
          </View>
        </ScrollView>

        {/* FAB */}
        <Pressable
          onPress={() => setAddModalVisible(true)}
          className="absolute bottom-8 right-5 h-16 w-16 items-center justify-center rounded-full bg-indigo-600"
          style={{ shadowColor: "#4f46e5", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 8 }}
        >
          <Ionicons name="add" size={32} color="#ffffff" />
        </Pressable>
      </SafeAreaView>

      <AddExpenseModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
      />
      <BudgetModal
        visible={budgetModalVisible}
        onClose={() => setBudgetModalVisible(false)}
        mode={budgetMode}
        sheet={sheet}
      />
    </View>
  );
}