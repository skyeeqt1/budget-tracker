import Ionicons from "@expo/vector-icons/Ionicons";
import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { usePreventRemove } from "expo-router/react-navigation";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ConfirmModal from "@/components/ConfirmModal";
import SuccessToast from "@/components/SuccessToast";
import { exportData, importData } from "@/lib/backup";

export default function SettingsScreen() {
  const [operation, setOperation] = useState<"backup" | "restore" | null>(
    null
  );
  const [restartRequired, setRestartRequired] = useState(false);
  const [backupSaved, setBackupSaved] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const operationInFlight = useRef(false);
  const nativeVersion = Constants.expoVersion
    ? null
    : Application.nativeApplicationVersion;
  const version =
    nativeVersion ?? Constants.expoConfig?.version ?? "Unavailable";

  usePreventRemove(operation !== null || restartRequired || showRestartModal, () => {
    Alert.alert(
      restartRequired ? "Restart required" : "Data operation in progress",
      restartRequired
        ? "Close the app completely and reopen it now."
        : "Finish or cancel the file operation before going back."
    );
  });

  const handleData = async (action: "backup" | "restore") => {
    if (operationInFlight.current || restartRequired) return;
    operationInFlight.current = true;
    setOperation(action);
    setBackupSaved(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      if (action === "restore") {
        setShowRestoreConfirm(true);
      } else {
        const result = await exportData();
        if (result === "saved") setBackupSaved(true);
        if (result === "empty") {
          Alert.alert(
            "Nothing to back up yet",
            "Create a budget first, or use Restore to import an existing backup."
          );
        }
      }
    } catch {
      Alert.alert(
        "Backup failed",
        "Could not export your data. Check the destination and file permissions, then try again."
      );
    } finally {
      operationInFlight.current = false;
      setOperation(null);
    }
  };

  const handleRestoreConfirm = async () => {
    setShowRestoreConfirm(false);
    operationInFlight.current = true;
    setOperation("restore");
    try {
      if (await importData()) {
        setRestartRequired(true);
        setShowRestartModal(true);
      }
    } catch {
      Alert.alert(
        "Restore failed",
        "Could not read, validate, or save this backup. Check file access and choose a Budget Tracker JSON backup, then try again."
      );
    } finally {
      operationInFlight.current = false;
      setOperation(null);
    }
  };

  const disabled =
    operation !== null || restartRequired || showRestartModal;

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-indigo-50">
      <ScrollView contentContainerClassName="px-5 pt-3 pb-8">
        <View className="mb-7 rounded-3xl bg-indigo-900 p-5">
          <Text className="text-[22px] font-bold text-white">
            Your budget, your records
          </Text>
          <Text className="mt-2 text-[14px] leading-6 text-indigo-100">
            Keep a copy of your data and find a little guidance when you need
            it.
          </Text>
        </View>

        <Text
          accessibilityRole="header"
          className="mb-3 text-[13px] font-bold uppercase tracking-widest text-indigo-800"
        >
          Data
        </Text>
        {restartRequired && (
          <View
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
            className="mb-4 flex-row items-start rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
          >
            <View className="mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <Ionicons name="checkmark" size={14} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-emerald-800">
                Restore complete
              </Text>
              <Text className="mt-1 text-[13px] leading-5 text-emerald-700">
                Restart the app to load your restored data.
              </Text>
            </View>
          </View>
        )}
        <View className="overflow-hidden rounded-3xl border border-ink-200 bg-white">
          {(["backup", "restore"] as const).map((action) => (
            <Pressable
              key={action}
              onPress={() => void handleData(action)}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={action === "backup" ? "Backup" : "Restore"}
              accessibilityHint={
                action === "backup"
                  ? "Export your saved data to a JSON file"
                  : "Confirm replacement of local data, then choose a backup file"
              }
              accessibilityState={{ disabled, busy: operation === action }}
              style={({ pressed }) => ({
                opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
              })}
              className="flex-row items-center p-5"
            >
              <View className="mr-4 h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100">
                <Ionicons
                  name={
                    action === "backup" ? "save-outline" : "folder-open-outline"
                  }
                  size={22}
                  color="#6346B8"
                />
              </View>
              <View className="flex-1">
                <Text className="text-[16px] font-semibold text-ink-900">
                  {action === "backup" ? "Backup" : "Restore"}
                </Text>
                <Text className="mt-1 text-[13px] leading-5 text-ink-600">
                  {action === "backup"
                    ? "Save a JSON copy of your records"
                    : "Replace local data from a JSON backup"}
                </Text>
              </View>
              {operation === action ? (
                <ActivityIndicator color="#6346B8" className="ml-3" />
              ) : (
                <Ionicons name="chevron-forward" size={18} color="#64748B" />
              )}
            </Pressable>
          ))}
        </View>

        <Text
          accessibilityRole="header"
          className="mb-3 mt-7 text-[13px] font-bold uppercase tracking-widest text-indigo-800"
        >
          Information
        </Text>
        <View className="rounded-3xl border border-ink-200 bg-white p-5">
          <Text
            accessibilityRole="header"
            className="text-[17px] font-bold text-ink-900"
          >
            How to use
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-ink-600">
            1. Tap New Budget on Home and enter your budget in Philippine
            pesos. It starts today and stays active until you create another
            budget.
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-ink-600">
            2. Tap Add to record an expense and choose a category. Home shows
            spending and the remaining balance. Use Edit on the budget card to
            adjust the amount.
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-ink-600">
            3. Creating a new budget closes the previous one. Find past budgets
            in History, where records are read-only and each budget can be
            exported as a PDF.
          </Text>
          <View className="my-5 h-px bg-ink-200" />
          <Text
            accessibilityRole="header"
            className="text-[17px] font-bold text-ink-900"
          >
            Privacy & local storage
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-ink-600">
            Your budgets and expenses are stored on this device, with no
            automatic cloud sync. Uninstalling the app or clearing its storage
            can delete your records. Keep a backup of important data.
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-ink-600">
            Backup files and PDF reports contain financial information and are
            not encrypted. Save and share them carefully. A storage service you
            choose may keep a copy in the cloud.
          </Text>
          <View className="my-5 h-px bg-ink-200" />
          <Text
            accessibilityRole="header"
            className="text-[17px] font-bold text-ink-900"
          >
            About
          </Text>
          <Text className="mt-3 text-[14px] leading-6 text-ink-600">
            Budget Tracker makes everyday personal budgeting in Philippine pesos
            simple, with offline budgets, expenses, and history.
          </Text>
          <Text
            selectable
            className="mt-4 text-[15px] font-semibold text-indigo-800"
          >
            {nativeVersion ? "Installed version" : "App config version"}:{" "}
            {version}
          </Text>
          <Text className="mt-1 text-[13px] leading-5 text-ink-600">
            {nativeVersion
              ? "The version baked into this installed app, which may differ from the current development config."
              : "Development fallback from Expo config, not a verified installed Budget Tracker version."}
          </Text>
        </View>
      </ScrollView>

      {/* Restore confirmation modal */}
      <ConfirmModal
        visible={showRestoreConfirm}
        title="Replace local data?"
        message="Restore replaces all saved budgets and expenses, rather than merging them. Back up first if you need a copy. Use a trusted Budget Tracker JSON backup and restart immediately after restore."
        confirmLabel="Choose backup"
        confirmDisabled={false}
        destructive
        onCancel={() => setShowRestoreConfirm(false)}
        onConfirm={handleRestoreConfirm}
      />

      {/* Restart guidance modal */}
      <Modal
        visible={showRestartModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6">
            <View className="items-center">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Ionicons name="checkmark-circle" size={32} color="#059669" />
              </View>
              <Text className="text-[20px] font-bold text-ink-900">
                Backup restored
              </Text>
              <Text className="mt-2 text-center text-[14px] leading-6 text-ink-500">
                Close the app completely and reopen it now.
              </Text>
              <Text className="mt-2 text-center text-[13px] leading-5 text-ink-400">
                The running app has not loaded the restored data. Making changes
                before restarting can overwrite it.
              </Text>
            </View>

            <Pressable
              onPress={() => setShowRestartModal(false)}
              accessibilityRole="button"
              className="mt-6 items-center rounded-2xl bg-indigo-600 py-4"
            >
              <Text className="text-[16px] font-bold text-white">
                I understand
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <SuccessToast
        visible={backupSaved}
        title="Backup saved"
        message="Your JSON backup was written to the selected folder."
        onHidden={() => setBackupSaved(false)}
      />
    </SafeAreaView>
  );
}
