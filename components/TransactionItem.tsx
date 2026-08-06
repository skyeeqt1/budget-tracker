import { Pressable, Text, View } from "react-native";

import CategoryIcon from "@/components/CategoryIcon";
import { getCategory } from "@/constants/categories";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { Expense } from "@/types";

interface Props {
  expense: Expense;
  onDelete?: (id: string) => void;
  showDate?: boolean;
}

export default function TransactionItem({
  expense,
  onDelete,
  showDate = false,
}: Props) {
  const meta = getCategory(expense.category);

  return (
    <View className="flex-row items-center justify-between bg-white px-1 py-3">
      <View className="flex-row items-center">
        <CategoryIcon category={expense.category} />
        <View className="ml-3">
          <Text className="text-[15px] font-semibold text-ink-900">
            {expense.title}
          </Text>
          <Text className="mt-0.5 text-[13px] text-ink-400">{meta.label}</Text>
          {showDate && (
            <Text className="mt-0.5 text-[11px] text-ink-400">
              {formatDateShort(expense.date)}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center">
        <Text className="text-[15px] font-bold text-ink-900">
          -{formatCurrency(expense.amount)}
        </Text>
        {onDelete && (
          <Pressable
            onPress={() => onDelete(expense.id)}
            hitSlop={10}
            className="ml-3 rounded-full bg-ink-100 p-1.5"
          >
            <Text className="text-[#cbd5e1] text-xs">✕</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}