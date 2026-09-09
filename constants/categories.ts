import type { CategoryId, CategoryMeta } from "@/types";

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "internet",
    label: "Internet",
    icon: "wifi",
    color: "#0ea5e9",
    textColor: "#ffffff",
    bgColor: "#f0f9ff",
  },
  {
    id: "electricity",
    label: "Electricity",
    icon: "flash",
    color: "#f59e0b",
    textColor: "#ffffff",
    bgColor: "#fffbeb",
  },
  {
    id: "waterBill",
    label: "Water Bill",
    icon: "water",
    color: "#06b6d4",
    textColor: "#ffffff",
    bgColor: "#ecfeff",
  },
  {
    id: "allowance",
    label: "Allowance",
    icon: "wallet",
    color: "#10b981",
    textColor: "#ffffff",
    bgColor: "#ecfdf5",
  },
  {
    id: "grocery",
    label: "Grocery",
    icon: "cart",
    color: "#f97316",
    textColor: "#ffffff",
    bgColor: "#fff7ed",
  },
  {
    id: "other",
    label: "Other",
    icon: "ellipsis-horizontal-circle",
    color: "#64748b",
    textColor: "#ffffff",
    bgColor: "#f1f5f9",
  },
];

const CATEGORY_MAP: Record<string, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<string, CategoryMeta>
);

export function getCategory(id: CategoryId): CategoryMeta {
  return CATEGORY_MAP[id] ?? CATEGORY_MAP.other;
}

export const DEFAULT_CATEGORY: CategoryId = "other";
