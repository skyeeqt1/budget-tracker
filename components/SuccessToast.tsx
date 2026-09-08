import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Text,
  View,
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;

interface Props {
  visible: boolean;
  title?: string;
  message: string;
  onHidden: () => void;
  duration?: number;
  success?: boolean;
}

export default function SuccessToast({
  visible,
  title,
  message,
  onHidden,
  duration = 2000,
  success = true,
}: Props) {
  const [translateY] = useState(() => new Animated.Value(-120));
  const [opacity] = useState(() => new Animated.Value(0));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(-120);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 14,
        stiffness: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => onHidden());
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, onHidden, translateY, opacity]);

  if (!visible) return null;

  const accentColor = success ? "bg-emerald-400" : "bg-rose-400";
  const iconBg = success ? "bg-emerald-100" : "bg-rose-100";
  const iconName = success ? "checkmark-circle" : "alert-circle";
  const iconColor = success ? "#10B981" : "#E11D48";
  const displayTitle = title ?? (success ? "Success" : "Error");

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 60,
        alignSelf: "center",
        width: SCREEN_W - 48,
        transform: [{ translateY }],
        opacity,
        zIndex: 999,
      }}
      className="rounded-2xl bg-white px-5 py-4"
    >
      <View className="flex-row items-center">
        <View className={`mr-3 h-10 w-10 items-center justify-center rounded-full ${iconBg}`}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>
        <View className="flex-1">
          <Text className="text-[15px] font-bold text-ink-900">{displayTitle}</Text>
          <Text className="mt-0.5 text-[12px] text-ink-500">{message}</Text>
        </View>
      </View>

      <View className={`mt-3 h-[3px] rounded-full ${accentColor}`} />
    </Animated.View>
  );
}
