import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";

import AppSplash from "@/components/AppSplash";
import { useBudgetStore } from "@/store/useBudgetStore";

import "../global.css";

export default function RootLayout() {
  const hydrated = useBudgetStore((s) => s.hydrated);
  const [timerDone, setTimerDone] = useState(false);
  const [forceReady, setForceReady] = useState(false);

  useEffect(() => {
    // Minimum brand-splash time.
    const timer = setTimeout(() => setTimerDone(true), 1400);
    // Safety net: never block the app if hydration is slow or fails silently.
    const fallback = setTimeout(() => setForceReady(true), 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(fallback);
    };
  }, []);

  const showSplash = !timerDone || (!hydrated && !forceReady);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="dark" />
      {showSplash && <AppSplash />}
    </>
  );
}
