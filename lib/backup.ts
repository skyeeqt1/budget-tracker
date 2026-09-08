import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import {
  StorageAccessFramework,
  EncodingType,
  writeAsStringAsync,
} from "expo-file-system/legacy";

const STORAGE_KEY = "budget-tracker-storage";

/** Export AsyncStorage data as a .json file via share sheet / SAF. */
export async function exportData(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return false;

  if (Platform.OS === "android") {
    const permissions =
      await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return false;

    const fileUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      "budget-tracker-backup",
      "application/json"
    );
    await writeAsStringAsync(fileUri, raw, {
      encoding: EncodingType.UTF8,
    });
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
  return true;
}

/** Import data from a .json file picked by the user. Returns true on success. */
export async function importData(): Promise<boolean> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.[0]) return false;

  // copyToCacheDirectory gives us a file:// URI we can read directly
  const fileUri = result.assets[0].uri;

  const response = await fetch(fileUri);
  if (!response.ok) {
    throw new Error(`Failed to read file: ${response.status}`);
  }
  const raw = await response.text();

  // Validate it's a valid JSON with the expected structure
  const parsed = JSON.parse(raw);
  if (!parsed.state?.sheets || !parsed.state?.expenses) {
    throw new Error("Invalid backup file");
  }

  // Write directly to AsyncStorage then reload
  await AsyncStorage.setItem(STORAGE_KEY, raw);
  return true;
}
