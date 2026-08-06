import { View } from "react-native";

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
  return (
    <View
      className="w-full overflow-hidden rounded-full"
      style={{ height, backgroundColor: trackColor }}
    >
      <View
        className="h-full rounded-full"
        style={{
          width: `${clamped * 100}%`,
          backgroundColor: barColor,
        }}
      />
    </View>
  );
}