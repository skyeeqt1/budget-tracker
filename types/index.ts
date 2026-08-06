export type CategoryId =
  | "internet"
  | "electricity"
  | "waterBill"
  | "allowance"
  | "grocery"
  | "other";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: CategoryId;
  date: string; // ISO date "YYYY-MM-DD"
  sheetId?: string; // budget sheet this expense belongs to
  createdAt: number; // epoch ms, used for stable ordering
}

export interface BudgetSheet {
  id: string;
  budget: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  createdAt: number;
}

export type NewExpense = Omit<Expense, "id" | "createdAt">;

export interface ExpenseDraft {
  title: string;
  amount: string;
  category: CategoryId;
  date: string;
}

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  icon: string;
  color: string; // hex accent used for icon chip backgrounds
  textColor: string;
  bgColor: string; // hex chip background
}

export interface BudgetSummary {
  budget: number;
  spent: number;
  remaining: number;
  ratio: number; // 0..1 (clamped)
  overBudget: boolean;
}
