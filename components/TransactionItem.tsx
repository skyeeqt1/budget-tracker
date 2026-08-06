import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
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

function TransactionItem({ expense, onDelete, showDate = false }: Props) {
  const meta = getCategory(expense.category);

  return (
    <View className="flex-row items-center justify-between bg-white px-1 py-3">
      <View className="flex-row flex-1 items-center">
        <CategoryIcon category={expense.category} />
        <View className="ml-3 flex-1">
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
        <Text
          className="text-[15px] font-bold text-ink-900"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          -{formatCurrency(expense.amount)}
        </Text>
        {onDelete && (
          <Pressable
            onPress={() => onDelete(expense.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${expense.title}`}
            className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-ink-100"
          >
            <Ionicons name="trash-outline" size={15} color="#94a3b8" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default memo(TransactionItem);
