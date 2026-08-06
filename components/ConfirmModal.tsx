import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { ComponentProps, useEffect, useRef } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}

export default function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: Props) {
  const iconBg = destructive ? "bg-rose-100" : "bg-indigo-50";
  const confirmBg = destructive ? "bg-rose-500" : "bg-indigo-600";
  const iconColor = destructive ? "#e11d48" : "#4f46e5";
  const iconName: IoniconName = destructive
    ? "trash-outline"
    : "checkmark-circle-outline";

  // Fast fade-in instead of the platform's slower default Modal fade.
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      opacity.setValue(0);
    }
  }, [visible, opacity]);

  const handleConfirm = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <Animated.View
        className="flex-1 items-center justify-center px-6"
        style={{
          backgroundColor: "rgba(15,23,42,0.45)",
          opacity,
        }}
      >
        <View className="w-full max-w-sm rounded-3xl bg-white p-6">
          <View className="items-center">
            <View
              className={`mb-4 h-16 w-16 items-center justify-center rounded-full ${iconBg}`}
            >
              <Ionicons name={iconName} size={28} color={iconColor} />
            </View>
            <Text className="text-[20px] font-bold text-ink-900">{title}</Text>
            <Text className="mt-1.5 text-center text-[13px] leading-5 text-ink-500">
              {message}
            </Text>
          </View>

          <View className="mt-6 flex-row">
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              className="mr-2 flex-1 items-center rounded-2xl bg-ink-100 py-3.5"
            >
              <Text className="text-[15px] font-semibold text-ink-700">
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              accessibilityRole="button"
              className={`ml-2 flex-1 items-center rounded-2xl py-3.5 ${confirmBg}`}
            >
              <Text className="text-[15px] font-bold text-white">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}