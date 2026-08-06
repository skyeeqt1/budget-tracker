import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps } from "react";
import { View } from "react-native";

import { getCategory } from "@/constants/categories";
import { CategoryId } from "@/types";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

interface Props {
  category: CategoryId;
  size?: number;
  iconSize?: number;
}

export default function CategoryIcon({
  category,
  size = 44,
  iconSize = 20,
}: Props) {
  const meta = getCategory(category);
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: meta.bgColor,
      }}
    >
      <Ionicons
        name={meta.icon as IoniconName}
        size={iconSize}
        color={meta.color}
      />
    </View>
  );
}
