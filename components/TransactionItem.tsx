import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { Pressable, Text, View } from "react-native";

import CategoryIcon from "@/components/CategoryIcon";
import { getCategory } from "@/constants/categories";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { useThemeStore } from "@/store/useThemeStore";
import { Expense } from "@/types";

interface Props {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: string) => void;
  showDate?: boolean;
}

function TransactionItem({ expense, onEdit, onDelete, showDate = false }: Props) {
  const meta = getCategory(expense.category);
  const { theme } = useThemeStore();

  return (
    <View className="flex-row items-center justify-between px-1 py-3" style={{ backgroundColor: theme.secondary }}>
      <View className="flex-row flex-1 items-center">
        <CategoryIcon category={expense.category} />
        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>
            {expense.title}
          </Text>
          <Text className="mt-0.5 text-[13px]" style={{ color: theme.muted }}>
            {meta.label}
          </Text>
          {showDate && (
            <Text className="mt-0.5 text-[11px]" style={{ color: theme.muted }}>
              {formatDateShort(expense.date)}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center">
        <Text
          className="text-[15px] font-bold"
          style={{ color: theme.text, fontVariant: ["tabular-nums"] }}
        >
          -{formatCurrency(expense.amount)}
        </Text>
        {onEdit && (
          <Pressable
            onPress={() => onEdit(expense)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${expense.title}`}
            className="ml-3 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.subtle }}
          >
            <Ionicons name="pencil-outline" size={15} color={theme.muted} />
          </Pressable>
        )}
        {onDelete && (
          <Pressable
            onPress={() => onDelete(expense.id)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${expense.title}`}
            className="ml-2 h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: theme.subtle }}
          >
            <Ionicons name="trash-outline" size={15} color={theme.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default memo(TransactionItem);
