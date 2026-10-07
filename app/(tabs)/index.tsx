import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { cssInterop } from "nativewind";
import { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
import { useKeyboardSheet } from "@/hooks/useKeyboardSheet";
import {
  formatCurrency,
  formatDateLong,
  formatDateRange,
  todayISO,
} from "@/lib/format";
import { useThemeStore } from "@/store/useThemeStore";
import {
  sortNewest,
  useActiveSheet,
  useBudgetStore,
} from "@/store/useBudgetStore";
import { Expense } from "@/types";

function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * factor).toString(16).padStart(2, "0")}${Math.round(g * factor).toString(16).padStart(2, "0")}${Math.round(b * factor).toString(16).padStart(2, "0")}`;
}

// SDK 57 ships precompiled gradient JSX, so NativeWind cannot intercept its
// internal views. Resolve the existing classes before passing styles to Expo.
cssInterop(LinearGradient, { className: "style" });

export default function DashboardScreen() {
  const { sheet, summary, periodExpenses } = useActiveSheet();
  const deleteExpense = useBudgetStore((s) => s.deleteExpense);
  const updateBudgetSheet = useBudgetStore((s) => s.updateBudgetSheet);
  const { theme } = useThemeStore();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [budgetMode, setBudgetMode] = useState<"create" | "edit">("create");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [addBudgetVisible, setAddBudgetVisible] = useState(false);
  const [addBudgetAmount, setAddBudgetAmount] = useState("");
  const [addBudgetError, setAddBudgetError] = useState<string | null>(null);
  const addBudgetSheet = useKeyboardSheet(addBudgetVisible);

  const recent = useMemo(
    () => sortNewest(periodExpenses),
    [periodExpenses]
  );

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
  };

  const handleEdit = (expense: Expense) => {
    setEditTarget(expense);
    setAddModalVisible(true);
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

  const handleAddBudget = () => {
    const parsed = parseFloat(addBudgetAmount);
    if (!sheet || !Number.isFinite(parsed) || parsed <= 0) {
      setAddBudgetError("Please enter a valid amount.");
      return;
    }
    updateBudgetSheet(sheet.id, { budget: sheet.budget + parsed });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setAddBudgetVisible(false);
    setAddBudgetAmount("");
    setAddBudgetError(null);
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
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <SafeAreaView edges={["top"]} className="flex-1">
        <View className="flex-1 px-5 pb-4 pt-3">
          {/* Header */}
          <View className="mb-5 flex-row items-center justify-between">
            <View className="mr-3 flex-1">
              <Text
                numberOfLines={1}
                className="text-[26px] font-bold tracking-tight"
                style={{ color: theme.text }}
              >
                Budget
              </Text>
              {sheet ? (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-[14px]"
                  style={{ color: theme.muted }}
                >
                  {formatDateRange(sheet.startDate, sheet.endDate)}
                </Text>
              ) : (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 text-[14px]"
                  style={{ color: theme.muted }}
                >
                  {formatDateLong(todayISO())}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => openBudgetModal("create")}
              accessibilityRole="button"
              accessibilityLabel="Create new budget"
              style={{
                backgroundColor: theme.primary,
              }}
              className="shrink-0 flex-row items-center rounded-full px-4 py-3"
            >
              <Ionicons name="add" size={18} color={theme.onPrimary} />
              <Text
                numberOfLines={1}
                className="ml-1 text-[14px] font-bold"
                style={{ color: theme.onPrimary }}
              >
                New Budget
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/settings")}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              accessibilityHint="Open backup, restore, and app information"
              hitSlop={8}
              style={{ backgroundColor: theme.subtle }}
              className="ml-2 h-11 w-11 items-center justify-center rounded-2xl"
            >
              <Ionicons name="settings-outline" size={22} color={theme.primary} />
            </Pressable>
          </View>

          {/* Hero budget card */}
          {hasSheet && summary ? (
            <Animated.View
              key={sheet.id}
              style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }}
            >
              <LinearGradient
                colors={[theme.primary, darkenColor(theme.primary, 0.75)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="mb-5 overflow-hidden rounded-3xl p-6"
              >
                <View className="mb-1 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="h-2 w-2 rounded-full bg-emerald-300" />
                    <Text
                      className="ml-2 text-[12px] font-semibold uppercase tracking-wider"
                      style={{ color: theme.onPrimary, opacity: 0.85 }}
                    >
                      Remaining Budget
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      setAddBudgetAmount("");
                      setAddBudgetError(null);
                      setAddBudgetVisible(true);
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Add to budget"
                    className="flex-row items-center rounded-full px-3 py-1.5"
                    style={{
                      backgroundColor: `${theme.onPrimary}1F`,
                      borderColor: `${theme.onPrimary}4D`,
                      borderWidth: 1,
                    }}
                  >
                    <Ionicons name="add" size={14} color={theme.onPrimary} />
                    <Text
                      className="ml-1 text-[12px] font-semibold"
                      style={{ color: theme.onPrimary }}
                    >
                      Add
                    </Text>
                  </Pressable>
                </View>
                <Text
                  className="mb-5 text-[13px]"
                  style={{ color: theme.onPrimary, opacity: 0.85 }}
                >
                  {formatDateRange(sheet.startDate, sheet.endDate)}
                </Text>

                <AnimatedNumber
                  value={summary.remaining}
                  className="text-[34px] font-bold tracking-tight"
                  style={{ color: theme.onPrimary }}
                />

                <View className="mt-4 flex-row items-center">
                  <View className="flex-1">
                    <ProgressBar
                      progress={summary.ratio}
                      barColor={barColor}
                      trackColor={`${theme.onPrimary}40`}
                      height={10}
                    />
                  </View>
                  <Text
                    className="ml-3 text-[12px] font-semibold"
                    style={{ color: theme.onPrimary }}
                  >
                    {Math.round(summary.ratio * 100)}%
                  </Text>
                </View>

                <View
                  className="mt-4 flex-row items-center justify-between rounded-2xl px-4 py-3"
                  style={{ backgroundColor: `${theme.onPrimary}1A` }}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="receipt-outline" size={16} color={theme.onPrimary} />
                    <View className="ml-2">
                      <Text
                        className="text-[11px]"
                        style={{ color: theme.onPrimary, opacity: 0.8 }}
                      >
                        Spent
                      </Text>
                      <Text
                        className="text-[15px] font-semibold"
                        style={{ color: theme.onPrimary }}
                      >
                        {formatCurrency(summary.spent)}
                      </Text>
                    </View>
                  </View>
                  <View
                    className="h-9 w-px"
                    style={{ backgroundColor: `${theme.onPrimary}33` }}
                  />
                  <View className="flex-row items-center">
                    <Ionicons name="flag-outline" size={16} color={theme.onPrimary} />
                    <View className="ml-2">
                      <Text
                        className="text-[11px]"
                        style={{ color: theme.onPrimary, opacity: 0.8 }}
                      >
                        Budget
                      </Text>
                      <Text
                        className="text-[15px] font-semibold"
                        style={{ color: theme.onPrimary }}
                      >
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
                    <Ionicons name="alert-circle" size={16} color="#F43F5E" />
                    <Text className="ml-2 flex-1 text-[13px] font-medium text-rose-500">
                      You have exceeded your budget.
                    </Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          ) : (
            <View className="mb-5 items-center rounded-3xl px-6 py-10" style={{ backgroundColor: theme.secondary }}>
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: `${theme.primary}20` }}>
                <Ionicons name="wallet-outline" size={26} color={theme.primary} />
              </View>
              <Text className="text-[17px] font-bold" style={{ color: theme.text }}>
                No active budget
              </Text>
              <Text className="mt-1 text-center text-[13px]" style={{ color: theme.muted }}>
                Set a budget for today to start tracking your expenses.
              </Text>
              <Pressable
                onPress={() => openBudgetModal("create")}
                accessibilityRole="button"
                style={{ backgroundColor: theme.primary }}
                className="mt-5 items-center rounded-2xl px-8 py-3.5"
              >
                <Text
                  className="text-[15px] font-bold"
                  style={{ color: theme.onPrimary }}
                >
                  Set Up Budget
                </Text>
              </Pressable>
            </View>
          )}

          {/* Transactions */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[18px] font-bold" style={{ color: theme.text }}>
              Transactions
            </Text>
            <Pressable
              onPress={handleAddPress}
              accessibilityRole="button"
              accessibilityLabel="Add expense"
              style={{ backgroundColor: theme.primary }}
              className="flex-row items-center rounded-full px-4 py-2"
            >
              <Ionicons name="add" size={16} color={theme.onPrimary} />
              <Text
                className="ml-1 text-[13px] font-bold"
                style={{ color: theme.onPrimary }}
              >
                Add
              </Text>
            </Pressable>
          </View>

          <View className="flex-1 overflow-hidden rounded-3xl" style={{ backgroundColor: theme.secondary }}>
            <ScrollView
              className="flex-1"
              contentContainerClassName="px-4 py-2"
              showsVerticalScrollIndicator={false}
            >
              {recent.length === 0 ? (
                <View className="items-center py-10">
                  <View
                    className="mb-3 h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: theme.subtle }}
                  >
                    <Ionicons name="receipt-outline" size={26} color={theme.muted} />
                  </View>
                  <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>
                    No expenses yet
                  </Text>
                  <Text className="mt-1 text-center text-[13px]" style={{ color: theme.muted }}>
                    Tap the + button below to record{"\n"}your first transaction.
                  </Text>
                </View>
              ) : (
                recent.map((expense) => (
                  <TransactionItem
                    key={expense.id}
                    expense={expense}
                    onEdit={handleEdit}
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
        onClose={() => {
          setAddModalVisible(false);
          setEditTarget(null);
        }}
        editExpense={editTarget}
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

      {/* Add budget amount modal */}
      <Modal
        visible={addBudgetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddBudgetVisible(false)}
      >
        <View
          onLayout={addBudgetSheet.onContainerLayout}
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "transparent" }}
        >
          <Pressable style={{ position: "absolute", inset: 0 }} onPress={() => setAddBudgetVisible(false)} />
          <Animated.View
            onLayout={addBudgetSheet.onSheetLayout}
            style={{ transform: [{ translateY: addBudgetSheet.translateY }] }}
          >
            <SafeAreaView edges={["bottom"]} className="rounded-t-3xl" style={{ backgroundColor: theme.secondary }}>
              <View className="px-5 pb-5">
              <View className="mb-4 items-center">
                <View
                  className="h-1.5 w-12 rounded-full"
                  style={{ backgroundColor: theme.border }}
                />
              </View>

              <View className="mb-5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${theme.primary}20` }}>
                    <Ionicons name="add-circle" size={20} color={theme.primary} />
                  </View>
                  <View>
                    <Text className="text-[22px] font-bold" style={{ color: theme.text }}>
                      Add to Budget
                    </Text>
                    <Text className="mt-0.5 text-[13px]" style={{ color: theme.muted }}>
                      Increase your remaining budget
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={() => setAddBudgetVisible(false)}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.subtle }}
                >
                  <Ionicons name="close" size={16} color={theme.muted} />
                </Pressable>
              </View>

              <Text className="mb-2 text-[13px] font-medium" style={{ color: theme.muted }}>
                Amount to add
              </Text>
              <View
                className="mb-4 flex-row items-center rounded-2xl border px-4"
                style={{ backgroundColor: theme.surface, borderColor: theme.border }}
              >
                <Text className="text-[20px] font-bold" style={{ color: theme.muted }}>
                  ₱
                </Text>
                <TextInput
                  value={addBudgetAmount}
                  onChangeText={(t) => {
                    const cleaned = t.replace(/[^0-9.]/g, "");
                    const parts = cleaned.split(".");
                    if (parts.length > 2) return;
                    if (parts[1] && parts[1].length > 2) return;
                    setAddBudgetAmount(cleaned);
                    setAddBudgetError(null);
                  }}
                  placeholder="0.00"
                  placeholderTextColor={theme.muted}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Amount to add"
                  className="ml-2 flex-1 py-3.5 text-[20px] font-semibold"
                  style={{ color: theme.text }}
                />
              </View>

              {addBudgetError && (
                <Text className="mb-3 text-[13px] font-medium text-rose-500">
                  {addBudgetError}
                </Text>
              )}

              <Pressable
                onPress={handleAddBudget}
                accessibilityRole="button"
                accessibilityLabel="Add amount to budget"
                style={{ backgroundColor: theme.primary }}
                className="mb-1 items-center rounded-2xl py-4"
              >
                <Text
                  className="text-[16px] font-bold"
                  style={{ color: theme.onPrimary }}
                >
                  Add to Budget
                </Text>
              </Pressable>
              </View>
            </SafeAreaView>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
