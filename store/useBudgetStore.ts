import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import {
  addDaysISO,
  todayISO,
  uid,
} from "@/lib/format";
import { BudgetSheet, Expense, NewExpense, BudgetSummary } from "@/types";

interface BudgetState {
  sheets: BudgetSheet[];
  expenses: Expense[];
  hydrated: boolean;
  createBudgetSheet: (data: Omit<BudgetSheet, "id" | "createdAt">) => void;
  updateBudgetSheet: (
    id: string,
    data: Partial<Pick<BudgetSheet, "budget" | "startDate" | "endDate">>
  ) => void;
  addExpense: (expense: NewExpense) => void;
  deleteExpense: (id: string) => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      sheets: [],
      expenses: [],
      hydrated: false,

      createBudgetSheet: (data) =>
        set((state) => {
          const active = currentSheet(state.sheets);
          const closeBefore = addDaysISO(data.startDate, -1);
          const sheets = active
            ? state.sheets.map((s) =>
                s.id === active.id
                  ? {
                      ...s,
                      endDate:
                        closeBefore < s.startDate ? s.startDate : closeBefore,
                    }
                  : s
              )
            : state.sheets;
          return {
            sheets: [
              ...sheets,
              {
                ...data,
                id: uid(),
                createdAt: Date.now(),
              },
            ],
          };
        }),

      updateBudgetSheet: (id, data) =>
        set((state) => ({
          sheets: state.sheets.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      addExpense: (expense) =>
        set((state) => {
          const sheetId = currentSheet(state.sheets)?.id;
          return {
            expenses: [
              ...state.expenses,
              {
                ...expense,
                id: uid(),
                date: expense.date || todayISO(),
                sheetId,
                createdAt: Date.now(),
              },
            ],
          };
        }),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),
    }),
    {
      name: "budget-tracker-storage",
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: () => ({
        sheets: [],
        expenses: [],
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
        }
      },
    }
  )
);

export function sortNewest(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const byTime = (b.createdAt || 0) - (a.createdAt || 0);
    if (byTime !== 0) return byTime;
    return (b.date || "").localeCompare(a.date || "");
  });
}

/** The active budget is the most recently created sheet; it stays active until a new one is created. */
export function currentSheet(sheets: BudgetSheet[]): BudgetSheet | null {
  if (sheets.length === 0) return null;
  return sheets.reduce((best, s) => (s.createdAt > best.createdAt ? s : best));
}

/** Expenses that belong to a specific budget sheet. */
export function expensesForSheet(
  expenses: Expense[],
  sheet: BudgetSheet
): Expense[] {
  return expenses.filter((e) => e.sheetId === sheet.id);
}

export function computeSummary(
  budget: number,
  periodExpenses: Expense[]
): BudgetSummary {
  const spent = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  const remaining = budget - spent;
  const ratio = budget > 0 ? Math.min(spent / budget, 1) : 0;
  return {
    budget,
    spent,
    remaining,
    ratio,
    overBudget: budget > 0 && spent > budget,
  };
}

export function useActiveSheet() {
  const sheets = useBudgetStore((s) => s.sheets);
  const expenses = useBudgetStore((s) => s.expenses);
  const sheet = currentSheet(sheets);
  const periodExpenses = sheet ? expensesForSheet(expenses, sheet) : [];
  return {
    sheet,
    summary: sheet ? computeSummary(sheet.budget, periodExpenses) : null,
    periodExpenses,
  };
}