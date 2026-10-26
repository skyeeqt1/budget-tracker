import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Text, View } from "react-native";

import { formatCurrency, formatDateShort } from "@/lib/format";
import { useThemeStore } from "@/store/useThemeStore";
import { BudgetAddition } from "@/types";

interface Props {
  addition: BudgetAddition;
  showDate?: boolean;
}

const CASH_ADDED = "#10B981";

function CashAddedItem({ addition, showDate = false }: Props) {
  const { theme } = useThemeStore();
  const dateISO = new Date(addition.createdAt).toISOString().slice(0, 10);

  return (
    <View
      className="flex-row items-center justify-between px-1 py-3"
      style={{ backgroundColor: theme.secondary }}
    >
      <View className="flex-row flex-1 items-center">
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: `${CASH_ADDED}20` }}
        >
          <Ionicons name="add-circle" size={20} color={CASH_ADDED} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-semibold" style={{ color: theme.text }}>
            Cash added
          </Text>
          <Text className="mt-0.5 text-[13px]" style={{ color: theme.muted }}>
            Added to budget
          </Text>
          {showDate && (
            <Text className="mt-0.5 text-[11px]" style={{ color: theme.muted }}>
              {formatDateShort(dateISO)}
            </Text>
          )}
        </View>
      </View>

      <Text
        className="text-[15px] font-bold"
        style={{ color: CASH_ADDED, fontVariant: ["tabular-nums"] }}
      >
        +{formatCurrency(addition.amount)}
      </Text>
    </View>
  );
}

export default memo(CashAddedItem);
