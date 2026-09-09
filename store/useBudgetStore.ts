import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createSafePersistence } from "./safePersistence";

import {
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

const persistence = createSafePersistence<BudgetState>(AsyncStorage);
export const budgetHydration = persistence.status;

export const useBudgetStore = create<BudgetState>()(
  persistence.wrap(
    (set) => ({
      sheets: [],
      expenses: [],
      hydrated: false,

      createBudgetSheet: (data) =>
        set((state) => {
          const active = currentSheet(state.sheets);
          // The active sheet stays active until a new one is created, so it
          // closes on the new sheet's start date (clamped to never end before
          // its own start). Example: created Aug 8, new budget on Aug 9
          // -> the previous sheet spans "Aug 8 - Aug 9".
          const sheets = active
            ? state.sheets.map((s) =>
                s.id === active.id
                  ? {
                      ...s,
                      endDate:
                        data.startDate < s.startDate
                          ? s.startDate
                          : data.startDate,
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
          const sheet = currentSheet(state.sheets);
          if (!sheet) return state;
          return {
            expenses: [
              ...state.expenses,
              {
                ...expense,
                id: uid(),
                date: expense.date || todayISO(),
                sheetId: sheet.id,
                createdAt: Date.now(),
              },
            ],
          };
        }),

      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),
    })
  )
);

/** Newest-first ordering: by expense date, then by creation time as a tiebreaker. */
export function sortNewest(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const byDate = (b.date || "").localeCompare(a.date || "");
    if (byDate !== 0) return byDate;
    return (b.createdAt || 0) - (a.createdAt || 0);
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
