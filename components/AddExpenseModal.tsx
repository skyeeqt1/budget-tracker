import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CATEGORIES, DEFAULT_CATEGORY, getCategory } from "@/constants/categories";
import { todayISO } from "@/lib/format";
import { useBudgetStore } from "@/store/useBudgetStore";
import { CategoryId, NewExpense } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AddExpenseModal({ visible, onClose }: Props) {
  const addExpense = useBudgetStore((s) => s.addExpense);

  const translateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(0);
  const fullWindowHeight = useRef(Dimensions.get("window").height);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>(DEFAULT_CATEGORY);
  const [date] = useState(todayISO());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const lift = (keyboardHeight: number) => {
      const windowHeight = Dimensions.get("window").height;
      const alreadyResized =
        keyboardHeight > 0 &&
        windowHeight + keyboardHeight <= fullWindowHeight.current + 10;
      const target = alreadyResized
        ? 0
        : Math.min(
            keyboardHeight,
            Math.max(0, fullWindowHeight.current - sheetHeight.current)
          );
      Animated.timing(translateY, {
        toValue: -target,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) => lift(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => lift(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY]);

  const parsedAmount = parseFloat(amount);
  const amountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;
  const isOther = category === "other";
  const titleValid = !isOther || title.trim().length > 0;
  const canSubmit = titleValid && amountValid;

  const reset = () => {
    translateY.setValue(0);
    setTitle("");
    setAmount("");
    setCategory(DEFAULT_CATEGORY);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
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
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "transparent" }}>
        <Pressable className="flex-1" onPress={handleClose} />

        <Animated.View
          onLayout={(e) => {
            sheetHeight.current = e.nativeEvent.layout.height;
          }}
          style={{ transform: [{ translateY }] }}
        >
          <SafeAreaView edges={["bottom"]} className="bg-white rounded-t-3xl">
            <View className="px-5 pb-5">
              {/* Handle */}
              <View className="mb-4 items-center">
                <View className="h-1.5 w-12 rounded-full bg-ink-200" />
              </View>

              <View className="mb-5 flex-row items-center justify-between">
                <View>
                  <Text className="text-[22px] font-bold text-ink-900">
                    Add Expense
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-ink-400">
                    Record a new transaction
                  </Text>
                </View>
                <Pressable
                  onPress={handleClose}
                  hitSlop={10}
                  className="h-9 w-9 items-center justify-center rounded-full bg-ink-100"
                >
                  <Text className="text-[16px] text-ink-500">✕</Text>
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
              <View className="mb-4 flex-row items-center rounded-2xl border border-ink-200 bg-ink-50 px-4">
                <Text className="text-[20px] font-bold text-ink-400">₱</Text>
                <TextInput
                  value={amount}
                  onChangeText={(t) => setAmount(t.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
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
                      onPress={() => setCategory(c.id)}
                      className={`mb-2 mr-2 flex-row items-center rounded-full border px-3.5 py-2 ${
                        selected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-ink-200 bg-white"
                      }`}
                    >
                      <View
                        className="mr-1.5 h-4 w-4 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <Text
                        className={`text-[13px] font-medium ${
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
              <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-ink-50 px-4 py-3">
                <Text className="text-[13px] font-medium text-ink-500">
                  Date
                </Text>
                <Text className="text-[14px] font-semibold text-ink-800">
                  {date}
                </Text>
              </View>

              {error && (
                <Text className="mb-3 text-[13px] font-medium text-rose-500">
                  {error}
                </Text>
              )}

              <Pressable
                onPress={handleSubmit}
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