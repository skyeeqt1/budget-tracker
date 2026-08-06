# Budget Tracker — Project Rules

## Tech Stack
- Expo SDK 54, React Native 0.81, React 19, TypeScript, expo-router, NativeWind (Tailwind), Zustand + AsyncStorage persistence.

## Versioned Docs
- This project targets Expo SDK 54. Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Commands (run after code changes)
- `npx tsc --noEmit` — type check
- `npm run lint` — lint
- `npx expo export --platform android` — verify the Android bundle builds

## Architecture & Data Model
- Data lives in `store/useBudgetStore.ts` (Zustand + `persist`, AsyncStorage, storage name `budget-tracker-storage`).
- Persist uses versions with a reset migration. Bumping the version wipes user's local data — do it intentionally.
- Entities:
  - `BudgetSheet` — single-day budget: `startDate === endDate` at creation.
  - `Expense` — bound to a sheet via required `sheetId`.
- Drop target SDK e.g., `react-native-worklets` must match reanimated version (current `react-native-worklets@0.5.1`).

## Business Rules
- User is a single person in the Philippines → currency is PHP (₱), no greeting/avatar.
- Categories fixed: Internet, Electricity, Water Bill, Allowance, Grocery, Other. (`constants/categories.ts`)
- Budget is for "today": start = end = today at creation. Do not add date pickers to the create modal.
- **Active budget** = most recently created sheet (`currentSheet` selector, date-agnostic). It stays active until a new one is created, regardless of phone date changes.
- Creating a new budget automatically **closes the previous sheet**: set its `endDate` to the day before the new sheet's start (clamped to never be before its own start). The previous sheet then lands in History.
- **History** shows only past (non-active) sheets, read-only — no delete. Group by sheet, sorted newest-first.
- Expenses are shown against the sheet they were created under (via `sheetId`); never fall back to date-range matching.

## UI / Styling Conventions
- NativeWind utility classes for layout/colors; avoid `shadow-*/opacity-*/bg-*/opacity-*` classes at runtime — use inline styles when needed.
- Categories fixed colors via `constants/categories.ts`.
- Empty states for Home and History screens.

## Modals & Keyboard
- `AddExpenseModal.tsx`, `BudgetModal.tsx` (create + edit), and `AppSplash.tsx` are bottom sheets / screens.
- Bottom-sheet modals must NOT be manually scrollable, must keep the keyboard from overlapping, and must NOT push past the top of the screen.
- Keyboard handling: use the animated `translateY` lift pattern (see `AddExpenseModal.tsx`): use `Dimensions.get("window")`, an `onLayout` to track sheet height, and detect whether the OS already resized the window (`windowHeight + keyboardHeight <= fullWindowHeight`). Only lift when the OS did not resize. Do not rely on `KeyboardAvoidingView` on Android.

## Dates
- Android's `toLocaleDateString` truncates month labels — use an explicit short-month array (`MONTHS_SHORT` in `lib/format.ts`).

## Branding / Splash
- Logo: `assets/images/tracker-logo.png` (1254×1254). Native splash uses `imageWidth: 200`; keep the in-app `AppSplash` logo size identical (200px) to avoid a size jump.

## Builds / Native
- `app.json` requires `softwareKeyboardLayoutMode: "resize"` and the splash/icon/adaptive-icon images.
- EAS lockfile/build install is sensitive: `package-lock.json` must be committed; `@emnapi/*` deps are pinned via `overrides` + devDependencies — do not remove.
- A native APK only reproduces what was baked in at build time; JS-only changes require a rebuild/reinstall. Live Expo Go (QR) shows latest code.