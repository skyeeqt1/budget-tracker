import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Animated, Modal, Pressable, Text, View } from "react-native";

import { exportData, importData } from "@/lib/backup";

interface Props {
  visible: boolean;
  onClose: () => void;
  onResult: (msg: string, success: boolean) => void;
}

export default function DataMenu({ visible, onClose, onResult }: Props) {
  const [opacity] = useState(() => new Animated.Value(0));

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

  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);
    try {
      const ok = await exportData();
      onClose();
      if (ok) onResult("Backup saved successfully", true);
    } catch {
      setLoading(false);
      onResult("Could not export data", false);
    }
  };

  const handleRestore = async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setLoading(true);
    try {
      const ok = await importData();
      onClose();
      if (ok) onResult("Data restored — restart the app to apply", true);
    } catch {
      setLoading(false);
      onResult("Not a valid backup file", false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{ opacity }}
        className="flex-1 items-center justify-end"
      >
        <Pressable className="absolute inset-0" onPress={onClose} />
        <View className="w-full rounded-t-3xl bg-white px-5 pb-8 pt-5">
          <View className="mb-5 items-center">
            <View className="h-1.5 w-12 rounded-full bg-ink-200" />
          </View>

          <Text className="mb-4 text-[17px] font-bold text-ink-900">Data</Text>

          <Pressable
            onPress={handleBackup}
            accessibilityRole="button"
            disabled={loading}
            style={({ pressed }) => [{ opacity: loading ? 0.5 : pressed ? 0.7 : 1 }]}
            className="mb-3 flex-row items-center rounded-2xl bg-indigo-50 px-4 py-4"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Ionicons name="cloud-upload-outline" size={20} color="#9381FF" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-ink-900">Backup</Text>
              <Text className="mt-0.5 text-[12px] text-ink-400">
                Save your data to a file
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </Pressable>

          <Pressable
            onPress={handleRestore}
            accessibilityRole="button"
            disabled={loading}
            style={({ pressed }) => [{ opacity: loading ? 0.5 : pressed ? 0.7 : 1 }]}
            className="flex-row items-center rounded-2xl bg-indigo-50 px-4 py-4"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Ionicons name="cloud-download-outline" size={20} color="#9381FF" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-semibold text-ink-900">Restore</Text>
              <Text className="mt-0.5 text-[12px] text-ink-400">
                Import data from a backup file
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}
