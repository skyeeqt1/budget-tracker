import { CATEGORIES } from "../constants/categories.ts";
import type { BudgetSheet, Expense } from "../types/index.ts";

export interface PersistedBudget {
  sheets: BudgetSheet[];
  expenses: Expense[];
  hydrated?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isTimestamp(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) &&
    Number.isFinite(new Date(value).getTime());
}

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Shared by startup and restore; never repair or guess record relationships. */
export function parseBudgetStorage(raw: string): { version: 3; state: PersistedBudget } {
  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed) || parsed.version !== 3) {
    throw new Error("Unsupported backup version. Expected persistence version 3.");
  }
  const state = parsed.state;
  if (!isRecord(state) || !Array.isArray(state.sheets) || !Array.isArray(state.expenses) ||
      ("hydrated" in state && typeof state.hydrated !== "boolean") ||
      // Zustand shallow-merges state on restart: unknown keys could replace actions.
      Object.keys(state).some((key) => !["sheets", "expenses", "hydrated"].includes(key))) {
    throw new Error("Invalid backup state.");
  }

  const sheetIds = new Set<string>();
  for (const sheet of state.sheets) {
    if (!isRecord(sheet) || !isText(sheet.id) || sheetIds.has(sheet.id) ||
        !isAmount(sheet.budget) || !isDate(sheet.startDate) || !isDate(sheet.endDate) ||
        sheet.endDate < sheet.startDate || !isTimestamp(sheet.createdAt)) {
      throw new Error("Invalid or duplicate budget sheet in backup.");
    }
    sheetIds.add(sheet.id);
  }

  const expenseIds = new Set<string>();
  for (const expense of state.expenses) {
    if (!isRecord(expense) || !isText(expense.id) || expenseIds.has(expense.id) ||
        !isText(expense.title) || !isAmount(expense.amount) || !isDate(expense.date) ||
        !isTimestamp(expense.createdAt) ||
        !CATEGORIES.some((category) => category.id === expense.category) ||
        !isText(expense.sheetId) || !sheetIds.has(expense.sheetId)) {
      throw new Error("Invalid, duplicate, or unlinked expense in backup.");
    }
    expenseIds.add(expense.id);
  }

  return parsed as unknown as { version: 3; state: PersistedBudget };
}

/** Validate completely before invoking the writer; keep compatible JSON unchanged. */
export async function restoreBackup(
  raw: string,
  write: (raw: string) => Promise<void>,
): Promise<void> {
  parseBudgetStorage(raw);
  await write(raw);
}
