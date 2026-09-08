import { useEffect, useState } from "react";
import { Animated, Text, useAnimatedValue, type TextProps } from "react-native";

import { formatCurrency } from "@/lib/format";

interface Props extends TextProps {
  value: number;
}

/**
 * Animated currency value that count-ups smoothly to the target on change.
 * Uses an Animated.Value + listener (not native driver) so it can drive text.
 */
export default function AnimatedNumber({ value, ...textProps }: Props) {
  const anim = useAnimatedValue(value);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const listener = anim.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(anim, {
      toValue: value,
      duration: 550,
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [value, anim]);

  return (
    <Text {...textProps} style={[{ fontVariant: ["tabular-nums"] }, textProps.style]}>
      {formatCurrency(display)}
    </Text>
  );
}
