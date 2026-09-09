import Ionicons from "@expo/vector-icons/Ionicons";
import { useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { exportData, importData } from "@/lib/backup";
import { useBudgetStore } from "@/store/useBudgetStore";

export default function DataRecovery({ loading }: { loading: boolean }) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [restart, setRestart] = useState(false);
  const disabled = loading || busy || restart;

  const run = async (action: "backup" | "restore" | "retry") => {
    if (loading || lock.current || restart) return;
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
        if (confirmed && (await importData())) setRestart(true);
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
    <SafeAreaView className="flex-1 bg-indigo-50">
      <ScrollView contentContainerClassName="px-5 pt-3 pb-8">
        {/* Header card */}
        <View className="mb-7 rounded-3xl bg-indigo-900 p-5">
          <View className="flex-row items-center">
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <Ionicons
                name={restart ? "checkmark-circle" : loading ? "hourglass" : "alert-circle"}
                size={22}
                color="#fff"
              />
            </View>
            <View className="flex-1">
              <Text className="text-[20px] font-bold text-white">
                {restart
                  ? "Restart required"
                  : loading
                    ? "Reading data"
                    : "Data couldn't load"}
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-[14px] leading-6 text-indigo-100">
            {restart
              ? "A backup was restored. Close the app completely and reopen it to load the new data."
              : loading
                ? "Editing is blocked while storage is being read. This usually finishes quickly."
                : "The stored data could not be read, or its format is unsupported. Your original data has not been replaced."}
          </Text>
        </View>

        {/* Status banner */}
        {restart && (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            className="mb-5 flex-row items-start rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <Ionicons name="checkmark" size={14} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-emerald-800">
                Restore complete
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-emerald-700">
                The running app has not loaded the restored data yet. Editing is
                blocked until you restart.
              </Text>
            </View>
          </View>
        )}

        {loading && (
          <View className="mb-5 flex-row items-start rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
            <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-indigo-100">
              <Ionicons name="hourglass" size={14} color="#6346B8" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-indigo-800">
                Still loading
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-indigo-700">
                If this takes too long, close the app completely and reopen it.
                Do not uninstall or clear storage.
              </Text>
            </View>
          </View>
        )}

        {!restart && !loading && (
          <View className="mb-5 flex-row items-start rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-rose-100">
              <Ionicons name="warning" size={14} color="#e11d48" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-rose-800">
                Storage error
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-rose-700">
                The app could not read your saved data. Export the original
                first, then try restoring from a backup.
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <Text
          accessibilityRole="header"
          className="mb-3 text-[13px] font-bold uppercase tracking-widest text-indigo-800"
        >
          Actions
        </Text>
        <View className="overflow-hidden rounded-3xl border border-ink-200 bg-white">
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
              style={({ pressed }) => ({
                opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
              })}
              className={`flex-row items-center p-5 ${
                i < 2 ? "border-b border-ink-100" : ""
              }`}
            >
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100">
                <Ionicons name={action.icon} size={22} color="#6346B8" />
              </View>
              <View className="flex-1">
                <Text className="text-[15px] font-semibold text-ink-900">
                  {action.title}
                </Text>
                <Text className="mt-1 text-[13px] leading-5 text-ink-500">
                  {action.desc}
                </Text>
              </View>
              {busy ? (
                <Ionicons name="hourglass" size={16} color="#94a3b8" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              )}
            </Pressable>
          ))}
        </View>

        {/* Privacy note */}
        <Text className="mt-4 px-1 text-[12px] leading-5 text-ink-400">
          Exports are unencrypted and may include sensitive financial data. Your
          chosen file provider may keep copies in the cloud.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
