import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { cssInterop } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  useAnimatedValue,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddExpenseModal from "@/components/AddExpenseModal";
import AnimatedNumber from "@/components/AnimatedNumber";
import BudgetModal from "@/components/BudgetModal";
import ConfirmModal from "@/components/ConfirmModal";
import ProgressBar from "@/components/ProgressBar";
import TransactionItem from "@/components/TransactionItem";
import {
  formatCurrency,
  formatDateLong,
  formatDateRange,
  todayISO,
} from "@/lib/format";
import {
  sortNewest,
  useActiveSheet,
  useBudgetStore,
} from "@/store/useBudgetStore";

// SDK 57 ships precompiled gradient JSX, so NativeWind cannot intercept its
// internal views. Resolve the existing classes before passing styles to Expo.
cssInterop(LinearGradient, { className: "style" });

export default function DashboardScreen() {
  const { sheet, summary, periodExpenses } = useActiveSheet();
  const deleteExpense = useBudgetStore((s) => s.deleteExpense);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetMode, setBudgetMode] = useState<"create" | "edit">("create");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const recent = useMemo(
    () => sortNewest(periodExpenses),
    [periodExpenses]
  );

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const hasSheet = !!sheet && !!summary;
  const barColor = !hasSheet
    ? "#B8B8FF"
    : summary.overBudget
      ? "#fb7185"
      : summary.ratio >= 0.75
        ? "#fbbf24"
        : "#34d399";

  const openBudgetModal = (mode: "create" | "edit") => {
    setBudgetMode(mode);
    setBudgetModalVisible(true);
  };

  /** Adding an expense without an active budget would orphan it, so guide to the budget flow instead. */
  const handleAddPress = () => {
    if (!sheet) {
      openBudgetModal("create");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setAddModalVisible(true);
  };

  // Hero entrance animation.
  const heroOpacity = useAnimatedValue(0);
  const heroTranslateY = useAnimatedValue(16);

  useEffect(() => {
    if (!hasSheet) {
      heroOpacity.setValue(0);
      heroTranslateY.setValue(16);
      return;
    }
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(heroTranslateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasSheet, heroOpacity, heroTranslateY]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F8F7FF" }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-1 px-5 pb-4 pt-3">
          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <View className="mr-3 flex-1">
              <Text
                numberOfLines={1}
                className="text-[26px] font-bold tracking-tight text-ink-900"
              >
                Budget
              </Text>
              {sheet ? (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-[14px] text-ink-400"
                >
                  {formatDateRange(sheet.startDate, sheet.endDate)}
                </Text>
              ) : (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-[14px] text-ink-400"
                >
                  {formatDateLong(todayISO())}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => openBudgetModal("create")}
              accessibilityRole="button"
              accessibilityLabel="Create new budget"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              className="shrink-0 flex-row items-center rounded-2xl bg-indigo-600 px-4 py-3"
            >
              <Ionicons name="add" size={18} color="#ffffff" />
              <Text
                numberOfLines={1}
                className="ml-1 text-[14px] font-bold text-white"
              >
                New Budget
              </Text>
            </Pressable>
          </View>

          {/* Hero budget card */}
          {hasSheet && summary ? (
            <Animated.View
              key={sheet.id}
              style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }}
            >
              <LinearGradient
                colors={["#9381FF", "#7C5CE0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="mb-5 overflow-hidden rounded-3xl p-6"
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="h-2 w-2 rounded-full bg-emerald-300" />
                    <Text className="ml-2 text-[12px] font-semibold uppercase tracking-wider text-indigo-200">
                      Remaining Budget
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => sheet && openBudgetModal("edit")}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Edit budget"
                    className="flex-row items-center rounded-full px-3 py-1.5"
                    style={({ pressed }) => [
                      { backgroundColor: "rgba(255,255,255,0.15)", opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Ionicons name="pencil" size={12} color="#F0EEFF" />
                    <Text className="ml-1.5 text-[12px] font-semibold text-indigo-100">
                      Edit
                    </Text>
                  </Pressable>
                </View>
                <Text className="mb-5 text-[13px] text-indigo-200">
                  {formatDateRange(sheet.startDate, sheet.endDate)}
                </Text>

                <AnimatedNumber
                  value={summary.remaining}
                  className="text-[34px] font-bold tracking-tight text-white"
                />

                <View className="mt-4 flex-row items-center">
                  <View className="flex-1">
                    <ProgressBar
                      progress={summary.ratio}
                      barColor={barColor}
                      trackColor="rgba(255,255,255,0.25)"
                      height={10}
                    />
                  </View>
                  <Text className="ml-3 text-[12px] font-semibold text-indigo-100">
                    {Math.round(summary.ratio * 100)}%
                  </Text>
                </View>

                <View
                  className="mt-4 flex-row items-center justify-between rounded-2xl px-4 py-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="receipt-outline" size={16} color="#F0EEFF" />
                    <View className="ml-2">
                      <Text className="text-[11px] text-indigo-200">Spent</Text>
                      <Text className="text-[15px] font-semibold text-white">
                        {formatCurrency(summary.spent)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="h-9 w-px"
                    style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                  />
                  <View className="flex-row items-center">
                    <Ionicons name="flag-outline" size={16} color="#F0EEFF" />
                    <View className="ml-2">
                      <Text className="text-[11px] text-indigo-200">Budget</Text>
                      <Text className="text-[15px] font-semibold text-white">
                        {formatCurrency(summary.budget)}
                      </Text>
                    </View>
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
            </Animated.View>
          ) : (
            <View className="mb-5 items-center rounded-3xl bg-white px-6 py-10">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-indigo-100">
                <Ionicons name="wallet-outline" size={26} color="#9381FF" />
              </View>
              <Text className="text-[17px] font-bold text-ink-900">
                No active budget
              </Text>
              <Text className="mt-1 text-center text-[13px] text-ink-400">
                Set a budget for today to start tracking your expenses.
              </Text>
              <Pressable
                onPress={() => openBudgetModal("create")}
                accessibilityRole="button"
                style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
                className="mt-5 items-center rounded-2xl bg-indigo-600 px-8 py-3.5"
              >
                <Text className="text-[15px] font-bold text-white">
                  Set Up Budget
                </Text>
              </Pressable>
            </View>
          )}

          {/* Transactions */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold text-ink-900">
              Transactions
            </Text>
            <Pressable
              onPress={handleAddPress}
              accessibilityRole="button"
              accessibilityLabel="Add expense"
              style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
              className="flex-row items-center rounded-full bg-indigo-600 px-4 py-2"
            >
              <Ionicons name="add" size={16} color="#ffffff" />
              <Text className="ml-1 text-[13px] font-bold text-white">
                Add
              </Text>
            </Pressable>
          </View>

          <View className="flex-1 overflow-hidden rounded-3xl bg-white">
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 py-2"
              showsVerticalScrollIndicator={false}
            >
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
                    showDate
                  />
                ))
              )}
            </ScrollView>
          </View>
        </View>
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
      <ConfirmModal
        visible={deleteTarget !== null}
        title="Delete expense"
        message="This cannot be undone. The expense will be removed permanently."
        confirmLabel="Delete"
        destructive
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteExpense(deleteTarget);
          setDeleteTarget(null);
        }}
      />
    </View>
  );
}
