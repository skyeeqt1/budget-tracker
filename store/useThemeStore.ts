import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getTheme, Theme } from "@/constants/themes";

const THEME_KEY = "budget-tracker-theme";

interface ThemeState {
  themeId: string;
  theme: Theme;
  setTheme: (id: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: "default",
      theme: getTheme("default"),
      setTheme: (id) => set({ themeId: id, theme: getTheme(id) }),
    }),
    {
      name: THEME_KEY,
      storage: {
        getItem: async (name) => {
          const raw = await AsyncStorage.getItem(name);
          return raw ? JSON.parse(raw) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);
