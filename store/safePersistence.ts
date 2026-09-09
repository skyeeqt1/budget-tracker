import { createStore } from "zustand/vanilla";
import type { StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import { parseBudgetStorage } from "../lib/restoreBackup.ts";
import type { PersistedBudget } from "../lib/restoreBackup.ts";

/** Status must not use persist's set: even a hydration flag would write defaults. */
export function createSafePersistence<T extends PersistedBudget>(storage: StateStorage) {
  const status = createStore<{ phase: "loading" | "ready" | "error" }>(() => ({ phase: "loading" }));
  const canWrite = () => status.getState().phase === "ready";

  const wrap = (creator: StateCreator<T>) => persist<T, [], [], PersistedBudget>(
    (set, get, api) => {
      const guardedSet: typeof set = (...args) => {
        if (canWrite()) set(...(args as Parameters<typeof set>));
      };
      // Guard both action setters and external store.setState calls.
      api.setState = guardedSet;
      return creator(guardedSet, get, api);
    },
    {
      name: "budget-tracker-storage",
      version: 3,
      storage: {
        getItem: async (name) => {
          const raw = await storage.getItem(name);
          return raw === null ? null : parseBudgetStorage(raw);
        },
        setItem: async (name, value) => {
          if (canWrite()) await storage.setItem(name, JSON.stringify(value));
        },
        // No app flow needs persist.clearStorage; never erase failed input.
        removeItem: () => {},
      },
      partialize: ({ sheets, expenses }) => ({ sheets, expenses }),
      migrate: () => { throw new Error("Unsupported persistence version"); },
      merge: (saved, current) => ({
        ...current,
        ...(saved as PersistedBudget | undefined),
        hydrated: true,
      }),
      onRehydrateStorage: () => {
        // Only show loading on initial hydration; a manual rehydrate after
        // restore must not flash the DataRecovery screen.
        if (status.getState().phase !== "ready") {
          status.setState({ phase: "loading" });
        }
        return (state) => {
          status.setState({ phase: state ? "ready" : "error" });
        };
      },
    },
  );
  return { status, wrap };
}
