import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { ComponentProps, useEffect } from "react";
import { ActivityIndicator, Animated, Modal, Pressable, Text, View, useAnimatedValue } from "react-native";
import { useThemeStore } from "@/store/useThemeStore";

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
  confirmDisabled?: boolean;
  loading?: boolean;
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
  confirmDisabled = false,
  loading = false,
}: Props) {
  const { theme } = useThemeStore();
  const iconBg = destructive ? "bg-rose-100" : "";
  const iconColor = destructive ? "#e11d48" : theme.primary;
  const iconName: IoniconName = destructive
    ? "trash-outline"
    : "checkmark-circle-outline";

  // Fast fade-in instead of the platform's slower default Modal fade.
  const opacity = useAnimatedValue(0);

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
          backgroundColor: "rgba(26,22,48,0.45)",
          opacity,
        }}
      >
        <View className="w-full max-w-sm rounded-3xl p-6" style={{ backgroundColor: theme.secondary }}>
          <View className="items-center">
            <View
              className={`mb-4 h-16 w-16 items-center justify-center rounded-full ${iconBg}`}
              style={!destructive ? { backgroundColor: `${theme.primary}20` } : undefined}
            >
              <Ionicons name={iconName} size={28} color={iconColor} />
            </View>
            <Text className="text-[20px] font-bold" style={{ color: theme.text }}>{title}</Text>
            <Text
              className="mt-1.5 text-center text-[13px] leading-5"
              style={{ color: theme.muted }}
            >
              {message}
            </Text>
          </View>

          <View className="mt-6 flex-row">
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              className="mr-2 flex-1 items-center rounded-2xl py-3.5"
              style={{ backgroundColor: theme.subtle }}
            >
              <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>
                {cancelLabel}
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              disabled={confirmDisabled}
              accessibilityRole="button"
              style={{
                opacity: confirmDisabled ? 0.5 : 1,
                backgroundColor: destructive ? "#F43F5E" : theme.primary,
              }}
              className="ml-2 flex-1 flex-row items-center justify-center rounded-2xl py-3.5"
            >
              {loading && (
                <ActivityIndicator
                  color={destructive ? "#FFFFFF" : theme.onPrimary}
                  className="mr-2"
                />
              )}
              <Text
                className="text-[15px] font-bold"
                style={{ color: destructive ? "#FFFFFF" : theme.onPrimary }}
              >
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}
