import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Animated,
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
import {
  formatDateLong,
  parseISO,
  sanitizeAmountInput,
  toISO,
  todayISO,
} from "@/lib/format";
import { useKeyboardLift } from "@/lib/useKeyboardLift";
import { useBudgetStore } from "@/store/useBudgetStore";
import { CategoryId, NewExpense } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({ visible, onClose }: Props) {
  const addExpense = useBudgetStore((s) => s.addExpense);

  const { translateY, handleSheetLayout, resetLift } = useKeyboardLift();

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
    resetLift();
    setTitle("");
    setAmount("");
    setCategory(DEFAULT_CATEGORY);
    setShowDatePicker(false);
    setError(null);
  };

  const handleClose = () => {
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
    const expense: NewExpense = {
      title: isOther ? title.trim() : getCategory(category).label,
      amount: parsedAmount,
      category,
      date,
    };
    addExpense(expense);
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
      onShow={() => setDate(todayISO())}
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "transparent" }}>
        <Pressable className="flex-1" onPress={handleClose} />

        <Animated.View
          onLayout={handleSheetLayout}
          style={{ transform: [{ translateY }] }}
        >
          <SafeAreaView edges={["bottom"]} className="bg-white rounded-t-3xl">
            <View className="px-5 pb-5">
              {/* Handle */}
              <View className="mb-4 items-center">
                <View className="h-1.5 w-12 rounded-full bg-ink-200" />
              </View>

              <View className="mb-5 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
                    <Ionicons name="receipt" size={20} color="#4f46e5" />
                  </View>
                  <View>
                    <Text className="text-[22px] font-bold text-ink-900">
                      Add Expense
                    </Text>
                    <Text className="mt-0.5 text-[13px] text-ink-400">
                      Record a new transaction
                    </Text>
                  </View>
                </View>
                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  className="h-9 w-9 items-center justify-center rounded-full bg-ink-100"
                >
                  <Ionicons name="close" size={16} color="#64748b" />
                </Pressable>
              </View>

              {/* Title: only for "Other" category */}
              {isOther && (
                <>
                  <Text className="mb-2 text-[13px] font-medium text-ink-500">
                    Title
                  </Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    placeholder="e.g. Electricity"
                    placeholderTextColor="#94a3b8"
                    className="mb-4 rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3.5 text-[16px] text-ink-900"
                  />
                </>
              )}

              {/* Amount */}
              <Text className="mb-2 text-[13px] font-medium text-ink-500">
                Amount
              </Text>
              <View
                className={`mb-4 flex-row items-center rounded-2xl border bg-ink-50 px-4 ${
                  amountFocused ? "border-indigo-500" : "border-ink-200"
                }`}
              >
                <Text className="text-[20px] font-bold text-ink-400">₱</Text>
                <TextInput
                  value={amount}
                  onChangeText={(t) => setAmount(sanitizeAmountInput(t))}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                  autoFocus
                  className="ml-2 flex-1 py-3.5 text-[20px] font-semibold text-ink-900"
                />
              </View>

              {/* Category */}
              <Text className="mb-2 text-[13px] font-medium text-ink-500">
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
                      accessibilityState={{ selected }}
                      className={`mb-2 mr-2 flex-row items-center rounded-2xl border px-2.5 py-2 ${
                        selected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-ink-200 bg-white"
                      }`}
                    >
                      <CategoryIcon category={c.id} size={28} iconSize={14} />
                      <Text
                        className={`ml-2 text-[13px] font-medium ${
                          selected ? "text-indigo-700" : "text-ink-600"
                        }`}
                      >
                        {c.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Date */}
              <Pressable
                onPress={() => setShowDatePicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Choose expense date"
                className="mb-4 flex-row items-center justify-between rounded-2xl bg-ink-50 px-4 py-3"
              >
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={15} color="#94a3b8" />
                  <Text className="ml-2 text-[13px] font-medium text-ink-500">
                    Date
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-[14px] font-semibold text-ink-800">
                    {formatDateLong(date)}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={14}
                    color="#94a3b8"
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
                  <Text className="text-[14px] font-semibold text-indigo-600">
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
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
                className="mb-1 items-center rounded-2xl bg-indigo-600 py-4"
              >
                <Text className="text-[16px] font-bold text-white">
                  Add Expense
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}