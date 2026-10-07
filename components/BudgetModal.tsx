import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Animated, Keyboard, Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { sanitizeAmountInput, todayISO } from "@/lib/format";
import { useKeyboardSheet } from "@/hooks/useKeyboardSheet";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useThemeStore } from "@/store/useThemeStore";
import { BudgetSheet } from "@/types";

interface Props {
  visible: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  sheet?: BudgetSheet | null;
}

export default function BudgetModal({
  visible,
  onClose,
  mode = "create",
  sheet,
}: Props) {
  const { translateY, onContainerLayout, onSheetLayout } =
    useKeyboardSheet(visible);
  const createBudgetSheet = useBudgetStore((s) => s.createBudgetSheet);
  const updateBudgetSheet = useBudgetStore((s) => s.updateBudgetSheet);
  const { theme } = useThemeStore();

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [amountFocused, setAmountFocused] = useState(false);

  const parsed = parseFloat(value);
  const valid = !Number.isNaN(parsed) && parsed > 0;

  const handleOpen = () => {
    setValue(mode === "edit" && sheet ? String(sheet.budget) : "");
    setError(null);
  };

  const handleClose = () => {
    Keyboard.dismiss();
    setAmountFocused(false);
    setError(null);
    onClose();
  };

  const handleSave = () => {
    if (!(parsed > 0)) {
      setError("Please enter a valid budget amount.");
      return;
    }
    if (mode === "edit" && sheet) {
      updateBudgetSheet(sheet.id, { budget: parsed });
    } else {
      const today = todayISO();
      createBudgetSheet({ budget: parsed, startDate: today, endDate: today });
    }
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
      () => {}
    );
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleOpen}
      onRequestClose={handleClose}
    >
      <View onLayout={onContainerLayout} className="flex-1 justify-end" style={{ backgroundColor: "transparent" }}>
        <Pressable style={{ position: "absolute", inset: 0 }} onPress={handleClose} />

        <Animated.View onLayout={onSheetLayout} style={{ transform: [{ translateY }] }}>
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
                    <Ionicons name="wallet" size={20} color={theme.primary} />
                  </View>
                  <View>
                    <Text className="text-[22px] font-bold" style={{ color: theme.text }}>
                      {mode === "edit" ? "Edit Budget" : "New Budget"}
                    </Text>
                    <Text className="mt-0.5 text-[13px]" style={{ color: theme.muted }}>
                      {mode === "edit"
                        ? "Update your budget goal"
                        : "Set your budget for today"}
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

              <Text className="mb-2 text-[13px] font-medium" style={{ color: theme.muted }}>
                Budget Amount
              </Text>
              <View
                className="mb-4 flex-row items-center rounded-2xl border px-4"
                style={{
                  backgroundColor: theme.surface,
                  borderColor: amountFocused ? theme.primary : theme.border,
                }}
              >
                <Text className="text-[24px] font-bold" style={{ color: theme.muted }}>
                  ₱
                </Text>
                <TextInput
                  value={value}
                  onChangeText={(t) => setValue(sanitizeAmountInput(t))}
                  onFocus={() => setAmountFocused(true)}
                  onBlur={() => setAmountFocused(false)}
                  placeholder="0.00"
                  placeholderTextColor={theme.muted}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Budget amount"
                  className="ml-2 flex-1 py-4 text-[24px] font-bold"
                  style={{ color: theme.text }}
                />
              </View>

              {mode === "create" && (
                <View
                  className="mb-4 flex-row items-start rounded-2xl px-3.5 py-3"
                  style={{ backgroundColor: `${theme.primary}15` }}
                >
                  <Ionicons name="information-circle" size={15} color={theme.primary} />
                  <Text className="ml-2 flex-1 text-[12px] leading-4" style={{ color: theme.primary }}>
                    This budget is for today. Creating it closes the previous
                    budget into your history.
                  </Text>
                </View>
              )}

              {error && (
                <Text className="mb-3 text-[13px] font-medium text-rose-500">
                  {error}
                </Text>
              )}

              <Pressable
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel={mode === "edit" ? "Save changes" : "Start budget"}
                style={{
                  backgroundColor: valid ? theme.primary : theme.border,
                }}
                className="mb-2 items-center rounded-2xl py-4"
              >
                <Text
                  className="text-[16px] font-bold"
                  style={{ color: valid ? theme.onPrimary : theme.muted }}
                >
                  {mode === "edit" ? "Save Changes" : "Start Budget"}
                </Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
