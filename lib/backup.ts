import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import {
  StorageAccessFramework,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system/legacy";

import { restoreBackup } from "./restoreBackup";

const STORAGE_KEY = "budget-tracker-storage";

/** Export AsyncStorage data as a .json file via share sheet / SAF. */
export async function exportData(): Promise<"empty" | "cancelled" | "saved" | "shared"> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return "empty";

  if (Platform.OS === "android") {
    const permissions =
      await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return "cancelled";

    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      "budget-tracker-backup",
      "application/json"
    );
    await writeAsStringAsync(fileUri, raw, {
      encoding: EncodingType.UTF8,
    });
    return "saved";
  } else {
    const { cacheDirectory } = await import("expo-file-system/legacy");
    const fileUri = (cacheDirectory ?? "") + "budget-tracker-backup.json";
    await writeAsStringAsync(fileUri, raw, {
      encoding: EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/json",
      dialogTitle: "Save Backup",
    });
  }
  return "shared";
}

/** Import data from a .json file picked by the user. Returns true on success. */
export async function importData(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return false;

  // Provider/runtime support for reading this cached URI can still fail.
  const fileUri = result.assets[0].uri;

  const response = await fetch(fileUri);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }
  const raw = await response.text();

  // The running store is not rehydrated; the user must restart immediately.
  await restoreBackup(raw, (validatedRaw) => AsyncStorage.setItem(STORAGE_KEY, validatedRaw));
  return true;
}
