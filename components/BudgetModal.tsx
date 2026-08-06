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

import { todayISO } from "@/lib/format";
import { useBudgetStore } from "@/store/useBudgetStore";
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
  const createBudgetSheet = useBudgetStore((s) => s.createBudgetSheet);
  const updateBudgetSheet = useBudgetStore((s) => s.updateBudgetSheet);

  const translateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(0);
  const fullWindowHeight = useRef(Dimensions.get("window").height);

  const [value, setValue] = useState("");
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

  const parsed = parseFloat(value);
  const valid = !Number.isNaN(parsed) && parsed > 0;

  const handleOpen = () => {
    setValue(sheet && sheet.budget > 0 ? String(sheet.budget) : "");
    setError(null);
  };

  const handleClose = () => {
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
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onShow={handleOpen}
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: "transparent" }}>
        <Pressable className="flex-1" onPress={handleClose} />

        <Animated.View
          onLayout={(e) => {
            sheetHeight.current = e.nativeEvent.layout.height;
          }}
          style={{ transform: [{ translateY }] }}
        >
          <SafeAreaView edges={["bottom"]} className="bg-white rounded-t-3xl">
            <View className="px-5 pb-5">
              <View className="mb-4 items-center">
                <View className="h-1.5 w-12 rounded-full bg-ink-200" />
              </View>

              <View className="mb-5 flex-row items-center justify-between">
                <View>
                  <Text className="text-[22px] font-bold text-ink-900">
                    {mode === "edit" ? "Edit Budget" : "New Budget Sheet"}
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-ink-400">
                    {mode === "edit"
                      ? "Update your budget goal"
                      : "Set your budget for today"}
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

              <Text className="mb-2 text-[13px] font-medium text-ink-500">
                Budget Amount
              </Text>
              <View className="mb-4 flex-row items-center rounded-2xl border border-ink-200 bg-ink-50 px-4">
                <Text className="text-[24px] font-bold text-ink-400">₱</Text>
                <TextInput
                  value={value}
                  onChangeText={(t) => setValue(t.replace(/[^0-9.]/g, ""))}
                  placeholder="0.00"
                  placeholderTextColor="#94a3b8"
                  keyboardType="decimal-pad"
                  className="ml-2 flex-1 py-4 text-[24px] font-bold text-ink-900"
                />
              </View>

              {mode === "create" && (
                <Text className="mb-4 text-[12px] text-ink-400">
                  This budget is for today. Creating it closes the previous
                  budget into your history.
                </Text>
              )}

              {error && (
                <Text className="mb-3 text-[13px] font-medium text-rose-500">
                  {error}
                </Text>
              )}

              <Pressable
                onPress={handleSave}
                disabled={!valid}
                className={`mb-2 items-center rounded-2xl py-4 ${
                  valid ? "bg-indigo-600" : "bg-ink-200"
                }`}
              >
                <Text className="text-[16px] font-bold text-white">
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