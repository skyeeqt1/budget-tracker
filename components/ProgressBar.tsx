import { useEffect, useRef } from "react";
import { Animated, View } from "react-native";

interface Props {
  /** 0..1 fraction of the bar filled */
  progress: number;
  barColor?: string;
  trackColor?: string;
  height?: number;
}

export default function ProgressBar({
  progress,
  barColor = "#6366f1",
  trackColor = "#e2e8f0",
  height = 10,
}: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  const anim = useRef(new Animated.Value(0)).current;

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
