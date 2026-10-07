import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { exportData, importData } from "@/lib/backup";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useThemeStore } from "@/store/useThemeStore";

export default function DataRecovery({ loading }: { loading: boolean }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const { theme } = useThemeStore();
  const disabled = loading || busy;

  const run = async (action: "backup" | "restore" | "retry") => {
    if (loading || lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      if (action === "retry") {
        await useBudgetStore.persist.rehydrate();
      } else if (action === "backup") {
        const result = await exportData();
        if (result === "saved")
          Alert.alert(
            "Original data exported",
            "The raw JSON was written to the selected folder. This does not mean it is a compatible backup."
          );
        if (result === "empty")
          Alert.alert("No stored data found", "Try reading again or reopen the app.");
      } else {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            "Replace stored data?",
            "Export the original first if you need it. Restore replaces it with a validated version-3 backup; it cannot repair or merge the original.",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Choose backup", style: "destructive", onPress: () => resolve(true) },
            ],
            { cancelable: true, onDismiss: () => resolve(false) }
          );
        });
        if (confirmed) await importData();
        // importData rehydrates the store; phase will change to "ready"
        // and the app will transition out of this screen automatically.
      }
    } catch {
      Alert.alert(
        "Data operation failed",
        "Could not read, validate, or save the data. Check file access and backup compatibility, then try again."
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }}>
      <ScrollView contentContainerClassName="px-5 pt-3 pb-8">
        {/* Header card */}
        <View className="mb-7 rounded-3xl p-5" style={{ backgroundColor: theme.primary }}>
          <View className="flex-row items-center">
            <View
              className="mr-3 h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${theme.onPrimary}33` }}
            >
              <Ionicons
                name={loading ? "hourglass" : "alert-circle"}
                size={22}
                color={theme.onPrimary}
              />
            </View>
            <View className="flex-1">
              <Text
                className="text-[20px] font-bold"
                style={{ color: theme.onPrimary }}
              >
                {loading ? "Reading data" : "Data couldn't load"}
              </Text>
            </View>
          </View>
          <Text
            className="mt-3 text-[14px] leading-6"
            style={{ color: theme.onPrimary, opacity: 0.85 }}
          >
            {loading
              ? "Editing is blocked while storage is being read. This usually finishes quickly."
              : "The stored data could not be read, or its format is unsupported. Your original data has not been replaced."}
          </Text>
        </View>

        {loading && (
          <View
            className="mb-5 flex-row items-start rounded-2xl border p-4"
            style={{ borderColor: theme.border, backgroundColor: theme.subtle }}
          >
            <View
              className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <Ionicons name="hourglass" size={14} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>
                Still loading
              </Text>
              <Text className="mt-1 text-[13px] leading-5" style={{ color: theme.muted }}>
                If this takes too long, close the app completely and reopen it.
                Do not uninstall or clear storage.
              </Text>
            </View>
          </View>
        )}

        {!loading && (
          <View
            className="mb-5 flex-row items-start rounded-2xl border p-4"
            style={{ borderColor: theme.border, backgroundColor: theme.secondary }}
          >
            <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-rose-100">
              <Ionicons name="warning" size={14} color="#e11d48" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-rose-500">
                Storage error
              </Text>
              <Text className="mt-1 text-[13px] leading-5" style={{ color: theme.muted }}>
                The app could not read your saved data. Export the original
                first, then try restoring from a backup.
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <Text
          accessibilityRole="header"
          className="mb-3 text-[13px] font-bold uppercase tracking-widest"
          style={{ color: theme.primary }}
        >
          Actions
        </Text>
        <View
          className="overflow-hidden rounded-3xl border"
          style={{ backgroundColor: theme.secondary, borderColor: theme.border }}
        >
          {(
            [
              {
                key: "backup",
                icon: "save-outline" as const,
                title: "Export original JSON",
                desc: "Save your raw stored data before attempting recovery",
              },
              {
                key: "restore",
                icon: "folder-open-outline" as const,
                title: "Restore from backup",
                desc: "Replace stored data with a validated version-3 backup",
              },
              {
                key: "retry",
                icon: "refresh" as const,
                title: "Retry reading data",
                desc: "Attempt to re-read the stored data",
              },
            ] as const
          ).map((action, i) => (
            <Pressable
              key={action.key}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled, busy }}
              onPress={() => void run(action.key)}
              style={{
                opacity: disabled ? 0.5 : 1,
                ...(i < 2
                  ? { borderBottomWidth: 1, borderBottomColor: theme.border }
                  : {}),
              }}
              className="flex-row items-center p-5"
            >
              <View
                className="mr-4 h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${theme.primary}20` }}
              >
                <Ionicons name={action.icon} size={22} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>
                  {action.title}
                </Text>
                <Text className="mt-1 text-[13px] leading-5" style={{ color: theme.muted }}>
                  {action.desc}
                </Text>
              </View>
              {busy ? (
                <Ionicons name="hourglass" size={16} color={theme.muted} />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={theme.muted} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Privacy note */}
        <Text className="mt-4 px-1 text-[12px] leading-5" style={{ color: theme.muted }}>
          Exports are unencrypted and may include sensitive financial data. Your
          chosen file provider may keep copies in the cloud.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
