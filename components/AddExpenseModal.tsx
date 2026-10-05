import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Animated,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORIES, DEFAULT_CATEGORY, getCategory } from "@/constants/categories";
import { useKeyboardSheet } from "@/hooks/useKeyboardSheet";
import {
  formatDateLong,
  parseISO,
  sanitizeAmountInput,
  toISO,
  todayISO,
} from "@/lib/format";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useThemeStore } from "@/store/useThemeStore";
import { CategoryId, Expense, NewExpense } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

export default function AddExpenseModal({ visible, onClose, editExpense }: Props) {
  const { translateY, onContainerLayout, onSheetLayout } =
    useKeyboardSheet(visible);
  const addExpense = useBudgetStore((s) => s.addExpense);
  const updateExpense = useBudgetStore((s) => s.updateExpense);
  const { theme } = useThemeStore();

  const isEditing = !!editExpense;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const [date, setDate] = useState(todayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amountFocused, setAmountFocused] = useState(false);

  const parsedAmount = parseFloat(amount);
  const amountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const isOther = category === "other";
  const titleValid = !isOther || title.trim().length > 0;
  const canSubmit = titleValid && amountValid;

  const reset = () => {
    setTitle("");
    setAmount("");
    setCategory(DEFAULT_CATEGORY);
    setShowDatePicker(false);
    setError(null);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setAmountFocused(false);
    reset();
    onClose();
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "set" && selected) setDate(toISO(selected));
    } else if (event.type === "set" && selected) {
      setDate(toISO(selected));
    }
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      setError(
        isOther
          ? "Please enter a title and a valid amount."
          : "Please enter a valid amount."
      );
      return;
    }
    if (isEditing && editExpense) {
      updateExpense(editExpense.id, {
        title: isOther ? title.trim() : getCategory(category).label,
        amount: parsedAmount,
        category,
        date,
      });
    } else {
      const expense: NewExpense = {
        title: isOther ? title.trim() : getCategory(category).label,
        amount: parsedAmount,
        category,
        date,
      };
      addExpense(expense);
    }
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success
    ).catch(() => {});
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={() => {
        if (editExpense) {
          setTitle(editExpense.title);
          setAmount(String(editExpense.amount));
          setCategory(editExpense.category);
          setDate(editExpense.date);
        } else {
          setDate(todayISO());
        }
      }}
      onRequestClose={handleClose}
    >
      <View onLayout={onContainerLayout} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "transparent" }}>
        <Pressable style={{ position: "absolute", inset: 0 }} onPress={handleClose} />

        <Animated.View onLayout={onSheetLayout} style={{ transform: [{ translateY }] }}>
          <SafeAreaView
            edges={["bottom"]}
            className="rounded-t-3xl"
            style={{ backgroundColor: theme.secondary }}
          >
            <View className="px-5 pb-5">
              {/* Handle */}
              <View className="mb-4 items-center">
                <View
                  className="h-1.5 w-12 rounded-full"
                  style={{ backgroundColor: theme.border }}
                />
              </View>

              <View className="mb-5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${theme.primary}20` }}>
                    <Ionicons name="receipt" size={20} color={theme.primary} />
                  </View>
                  <View>
                    <Text className="text-[22px] font-bold" style={{ color: theme.text }}>
                      {isEditing ? "Edit Expense" : "Add Expense"}
                    </Text>
                    <Text className="mt-0.5 text-[13px]" style={{ color: theme.muted }}>
                      {isEditing ? "Update transaction details" : "Record a new transaction"}
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: theme.subtle }}
                >
                  <Ionicons name="close" size={16} color={theme.muted} />
                </Pressable>
              </View>

              {/* Title: only for "Other" category */}
              {isOther && (
                <>
                  <Text className="mb-2 text-[13px] font-medium" style={{ color: theme.muted }}>
                    Title
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Electricity"
                    placeholderTextColor={theme.muted}
                    accessibilityLabel="Expense title"
                    className="mb-4 rounded-2xl border px-4 py-3.5 text-[16px]"
                    style={{
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    }}
                  />
                </>
              )}

              {/* Amount */}
              <Text className="mb-2 text-[13px] font-medium" style={{ color: theme.muted }}>
                Amount
              </Text>
              <View
                className="mb-4 flex-row items-center rounded-2xl border px-4"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: amountFocused ? theme.primary : theme.border,
                }}
              >
                <Text className="text-[20px] font-bold" style={{ color: theme.muted }}>
                  ₱
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={(t) => setAmount(sanitizeAmountInput(t))}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  placeholder="0.00"
                  placeholderTextColor={theme.muted}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Expense amount"
                  className="ml-2 flex-1 py-3.5 text-[20px] font-semibold"
                  style={{ color: theme.text }}
                />
              </View>

              {/* Category */}
              <Text className="mb-2 text-[13px] font-medium" style={{ color: theme.muted }}>
                Category
              </Text>
              <View className="mb-4 flex-row flex-wrap">
                {CATEGORIES.map((c) => {
                  const selected = category === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => {
                        setCategory(c.id);
                        void Haptics.selectionAsync().catch(() => {});
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${c.label} category`}
                      accessibilityState={{ selected }}
                      className="mb-2 mr-2 flex-row items-center rounded-2xl border px-2.5 py-2"
                      style={
                        selected
                          ? {
                              borderColor: theme.primary,
                              backgroundColor: `${theme.primary}15`,
                            }
                          : {
                              borderColor: theme.border,
                              backgroundColor: theme.surface,
                            }
                      }
                    >
                      <CategoryIcon category={c.id} size={28} iconSize={14} />
                      <Text
                        className="ml-2 text-[13px] font-medium"
                        style={{ color: selected ? theme.primary : theme.muted }}
                      >
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Date */}
              <Pressable
                onPress={() => {
                  Keyboard.dismiss();
                  setShowDatePicker(true);
                }}
                accessibilityRole="button"
                accessibilityLabel="Choose expense date"
                className="mb-4 flex-row items-center justify-between rounded-2xl px-4 py-3"
                style={{ backgroundColor: theme.surface }}
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={15} color={theme.muted} />
                  <Text className="ml-2 text-[13px] font-medium" style={{ color: theme.muted }}>
                    Date
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-[14px] font-semibold" style={{ color: theme.text }}>
                    {formatDateLong(date)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color={theme.muted}
                    style={{ marginLeft: 4 }}
                  />
                </View>
              </Pressable>

              {showDatePicker && (
                <DateTimePicker
                  value={parseISO(date)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "calendar"}
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />
              )}

              {Platform.OS === "ios" && showDatePicker && (
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  accessibilityRole="button"
                  className="mb-4 items-end"
                >
                  <Text className="text-[14px] font-semibold" style={{ color: theme.primary }}>
                    Done
                  </Text>
                </Pressable>
              )}

              {error && (
                <Text className="mb-3 text-[13px] font-medium text-rose-500">
                  {error}
                </Text>
              )}

              <Pressable
                onPress={handleSubmit}
                accessibilityRole="button"
                accessibilityLabel={isEditing ? "Save changes" : "Add expense"}
                style={{ backgroundColor: theme.primary }}
                className="mb-1 items-center rounded-2xl py-4"
              >
                <Text
                  className="text-[16px] font-bold"
                  style={{ color: theme.onPrimary }}
                >
                  {isEditing ? "Save Changes" : "Add Expense"}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
