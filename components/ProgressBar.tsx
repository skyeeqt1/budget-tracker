import { useEffect } from "react";
import { Animated, View, useAnimatedValue } from "react-native";

interface Props {
  /** 0..1 fraction of the bar filled */
  progress: number;
  barColor?: string;
  trackColor?: string;
  height?: number;
}

export default function ProgressBar({
  progress,
  barColor = "#9381FF",
  trackColor = "#E2E0ED",
  height = 10,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const anim = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: clamped,
      duration: 500,
      useNativeDriver: false, // animating width percentage
    }).start();
  }, [clamped, anim]);

  const width = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      className="w-full overflow-hidden rounded-full"
      style={{ height, backgroundColor: trackColor }}
    >
      <Animated.View
        className="h-full rounded-full"
        style={{
          width,
          backgroundColor: barColor,
        }}
      />
    </View>
  );
}
