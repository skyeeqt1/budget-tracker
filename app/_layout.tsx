import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useStore } from "zustand";

import AppSplash from "@/components/AppSplash";
import DataRecovery from "@/components/DataRecovery";
import { budgetHydration } from "@/store/useBudgetStore";
import { useThemeStore } from "@/store/useThemeStore";

import "../global.css";

export default function RootLayout() {
  const phase = useStore(budgetHydration, (s) => s.phase);
  const { theme } = useThemeStore();
  const [timerDone, setTimerDone] = useState(false);
  const [readSlow, setReadSlow] = useState(false);

  useEffect(() => {
    // Minimum brand-splash time.
    const timer = setTimeout(() => setTimerDone(true), 1400);
    // A slow read reveals guidance, never editing or a persistence write.
    const fallback = setTimeout(() => setReadSlow(true), 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  const showSplash = !timerDone || (phase === "loading" && !readSlow);

  if (showSplash) return <AppSplash />;
  if (phase !== "ready") return <><DataRecovery loading={phase === "loading"} /><StatusBar style="dark" /></>;

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{
            title: "Settings",
            headerBackButtonDisplayMode: "minimal",
            headerTintColor: theme.primary,
            headerTitleStyle: { color: theme.text },
            headerStyle: { backgroundColor: theme.background },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
