# Budget Tracker — Project Rules

## Response Style
Always use caveman mode. Default level: full.

## Tech Stack
- Expo SDK 57 (expo 57.0.20), React Native 0.86.3, React 19.2.3, TypeScript 6.0, expo-router 57, NativeWind 4 (Tailwind 3), Zustand + AsyncStorage persistence.

## Versioned Docs
- This project targets Expo SDK 57. Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
- SDK 57 requires Node.js 22.13+ and iOS 16.4+; native iOS builds require Xcode 26.4+ (macOS or EAS Build).

## Commands (run after code changes)
- `npx tsc --noEmit` — type check
- `npm run lint` — lint
- `npx expo export --platform android` — verify the Android bundle builds
- `npx expo export --platform ios` — verify the iOS bundle builds
- `npx expo-doctor` — check SDK configuration and dependency compatibility

## Architecture & Data Model
- Data lives in `store/useBudgetStore.ts` (Zustand + `persist`, AsyncStorage, storage name `budget-tracker-storage`).
- Persistence stays at version 3. `store/safePersistence.ts` validates raw storage with `parseBudgetStorage` before Zustand can merge or migrate it. No older-version migrations are supported: reachable history first introduces the store at version 3 in `8f12cef`; the preceding `47984a7` is the Expo starter, with no store. Do not infer version-0/1/2 schemas or invent expense links. App release versions are separate.
- Valid version-3 data (including the legacy optional boolean `hydrated`) loads without a startup write; only a missing storage key (`null`) means a fresh install. Malformed JSON, unsupported/missing versions, invalid records, unknown state keys, and unlinked expenses fail closed with no replacement/delete. Historical TypeScript allowed optional `sheetId`, but startup/restore require real references and never date-match or discard orphan records.
- Hydration status lives in a separate non-persisted store, not a persisted `setHydrated` action. Both action setters and external `setState` are blocked until successful hydration; the storage adapter also blocks writes while loading/failed and makes `persist.clearStorage` a no-op. New writes persist only sheets/expenses. Do not add a timeout or error callback that writes defaults or marks failed data ready.
- Root mounts editing/navigation only after hydration succeeds. After three seconds a pending read shows guidance instead of an endless splash, but remains locked (no overlapping retry/restore while the read is pending). Failure recovery offers raw JSON export, retry, and explicitly confirmed version-3 restore. Restore stays blocked pending complete close/reopen; exporting unsupported JSON does not make it restorable. Provider/storage failures and already-lost data cannot be repaired by this guard.
- Run persistence and restore regressions with `node --experimental-strip-types --test lib/restoreBackup.test.mjs store/safePersistence.test.mjs`.
- Entities:
  - `BudgetSheet` — single-day budget: `startDate === endDate` at creation.
  - `Expense` — bound to a sheet via required `sheetId`.
- Keep animation dependencies aligned with SDK 57: `react-native-reanimated@4.5.1` and `react-native-worklets@0.10.1`. Use `npx expo install --check` to verify alignment.

## Business Rules
- User is a single person in the Philippines → currency is PHP (₱), no greeting/avatar.
- Categories fixed: Internet, Electricity, Water Bill, Allowance, Grocery, Other. (`constants/categories.ts`)
- Budget is for "today": start = end = today at creation. Do not add date pickers to the create modal.
- **Active budget** = most recently created sheet (`currentSheet` selector, date-agnostic). It stays active until a new one is created, regardless of phone date changes.
- Creating a new budget automatically **closes the previous sheet**: set its `endDate` to the new sheet's start date (the day it was closed, clamped to never be before its own start). The previous sheet then lands in History.
- **History** shows only past (non-active) sheets, read-only — no delete. Group by sheet, sorted newest-first.
- Expenses are shown against the sheet they were created under (via `sheetId`); never fall back to date-range matching.

## UI / Styling Conventions
- NativeWind utility classes for layout/colors; avoid `shadow-*/opacity-*/bg-*/opacity-*` classes at runtime — use inline styles when needed.
- Categories fixed colors via `constants/categories.ts`.
- Empty states for Home and History screens.
- Keep Home/History as the only bottom tabs. Home's accessible gear pushes `/settings` (`app/settings.tsx`), registered in the root stack outside `(tabs)` with the native back arrow. Settings remains reachable with no budget and uses scrollable, safe-area-aware content for Data and Information.
- Settings About uses `expo-application`'s `nativeApplicationVersion` for the installed binary. In Expo Go (or without a native version), label the `Constants.expoConfig.version` fallback explicitly; do not display the Expo Go host version as Budget Tracker's version. SDK 57 removed `Constants.nativeAppVersion`, so the added `expo-application` dependency is necessary for native reporting.

## Modals & Keyboard
- `AddExpenseModal.tsx` and `BudgetModal.tsx` (create + edit) are bottom sheets; `AppSplash.tsx` is the in-app splash screen.
- Bottom-sheet modals must NOT be manually scrollable, must keep the keyboard from overlapping, and must NOT push past the top of the screen.
- Both form sheets use `hooks/useKeyboardSheet.ts`: wire `onContainerLayout` to the modal container, `onSheetLayout` to the sheet, and apply animated `translateY`. Measured modal height takes precedence over `Dimensions` because Android Modal has a separate Dialog window. The hook accounts for OS resize, lifts only for remaining keyboard overlap, and clamps movement against the top safe-area inset plus 8px. Do not replace it with `KeyboardAvoidingView` on Android.
- Neither form auto-focuses inputs. Keep the keyboard closed until the user taps an input; dismiss it on close and before opening the expense date picker.
- On each budget modal open, create mode starts with an empty amount (`0.00` is only a placeholder); edit mode prefills the selected sheet's budget. Never carry the previous budget amount into create mode.
- The keyboard hook prioritizes keeping the top reachable when the sheet exceeds available height; this is not a guarantee that every control fits on every screen/keyboard combination. Verify small-screen and large-text behavior on devices without adding manual scrolling.

## Backup & Restore
- `lib/backup.ts` exports the raw `budget-tracker-storage` JSON. Android uses `StorageAccessFramework` (SAF) from `expo-file-system/legacy` to request a folder and write UTF-8 JSON with base name `budget-tracker-backup`; iOS writes `budget-tracker-backup.json` to cache and opens the share sheet. Share-sheet completion does not prove the user saved a file.
- Backup/Restore live in Settings > Data; the old DataMenu has been removed. `exportData` distinguishes `empty`, `cancelled`, `saved` (Android write), and `shared` (share-sheet completion). Only `saved` shows a success toast; share completion and cancellation never imply a saved copy.
- Settings shares a synchronous ref lock across both operations and releases it plus loading state in `finally`, including confirmation cancellation/dismissal, picker cancellation, and errors. Keep failure alerts distinct from success, and keep cancel/retry usable. Navigation is blocked during an operation and after restore pending restart.
- Restore asks for replacement confirmation, then uses `expo-document-picker` with `application/json` and `copyToCacheDirectory: true` and reads the picked URI with `fetch`. File URI/provider support can fail; do not describe this as guaranteed on all runtimes. Error wording covers read, validation, and storage failures rather than assuming every error is an invalid file.
- `lib/restoreBackup.ts` validates the version-3 persisted envelope, state arrays, optional boolean `hydrated`, entity fields, positive finite amounts, real calendar dates, epoch-millisecond timestamps, known categories, unique IDs within each entity collection, and required expense-to-sheet references before invoking the storage writer. Unknown state keys are rejected because Zustand merges them into the running store; extra envelope/entity fields are preserved. Unsupported versions and invalid payloads never reach the writer. Compatible raw JSON is written unchanged, without migration. Run focused tests with `node --experimental-strip-types --test lib/restoreBackup.test.mjs`.
- Restore overwrites the storage key, does not merge or rehydrate the running Zustand store, and requires an app restart. Restart immediately before making further changes that could overwrite the restored data.
- Settings displays persistent close-completely-and-reopen guidance after restore, not a transient promise of loaded records. Help/privacy copy must note local storage, no app-managed automatic cloud sync, sensitive unencrypted exports, and possible cloud copies via user-selected file providers; avoid security or recovery guarantees.
- Expo Go cannot access a standalone APK's private storage. Transfer requires a backup exported from the app/container holding the data; if an old APK cannot export, opening newer code in Expo Go does not recover it.

## PDF Export
- History exports individual past sheets using `lib/generatePdf.ts` and `pdf-lib` with standard Helvetica fonts, not a native print pipeline. Currency uses `PHP ` instead of the peso symbol for font compatibility; arbitrary Unicode expense titles are not guaranteed to render.
- Android requests a SAF folder and writes a base64 PDF. The requested filename is `MM-DD-YY.pdf` from the sheet's start date (not the export date); the file provider controls the final name and duplicate handling. History shows a success toast with the returned requested filename only after the write succeeds. Permission denial/cancellation returns no filename and shows no success toast.
- iOS writes `budget-record.pdf` to cache and opens the share sheet (including Save to Files). It returns no filename and does not show the Android save-success toast; share completion is not confirmation of a saved file.

## Dates
- Android's `toLocaleDateString` truncates month labels — use an explicit short-month array (`MONTHS_SHORT` in `lib/format.ts`).

## Branding / Splash
- Logo: `assets/images/tracker-logo.png` (1254×1254). Native splash uses `imageWidth: 200`; keep the in-app `AppSplash` logo size identical (200px) to avoid a size jump.

## Builds / Native
- Preserve the managed/CNG workflow: generated `android` and `ios` folders are ignored and must not be committed. SDK 57 requires the New Architecture and Android edge-to-edge; do not restore removed `newArchEnabled` or `edgeToEdgeEnabled` flags.
- `app.json` requires `softwareKeyboardLayoutMode: "resize"` and the splash/icon/adaptive-icon images.
- EAS lockfile/build install is sensitive: `package-lock.json` must be committed; `@emnapi/*` deps are pinned via `overrides` + devDependencies — do not remove.
- A native APK only reproduces what was baked in at build time; JS-only changes require a rebuild/reinstall. Live Expo Go (QR) shows latest code.
- The display/release version is `expo.version` in `app.json`, currently `1.1.0` (not `package.json`, which remains `1.0.0`). Set display versions explicitly. `eas.json` uses remote version management with `autoIncrement: true` for preview and production: this increments Android `versionCode` / iOS `buildNumber`, not the display version; development has no auto-increment configured.
- An Android in-place upgrade requires the same package (`com.budgettracker`) and signing certificate, plus an appropriate higher `versionCode`. Preserve EAS signing credentials. Do not uninstall or clear storage to upgrade when retaining data matters. Matching package/signing permits an upgrade but cannot recover data already lost to older reset migrations; keep a usable backup where possible.
