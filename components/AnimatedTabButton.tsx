import type { BottomTabBarButtonProps } from "expo-router/js-tabs";
import { PlatformPressable } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Platform } from "react-native";

const AnimatedPressable = Animated.createAnimatedComponent(PlatformPressable);

export default function AnimatedTabButton({
  style,
  onPressIn,
  onPressOut,
  ...props
}: BottomTabBarButtonProps) {
  const [scale] = useState(() => new Animated.Value(1));
  // Don't animate until the initial accessibility preference is known.
  const reduceMotion = useRef(true);

  useEffect(() => {
    let mounted = true;
    let preferenceChanged = false;
    const updatePreference = (enabled: boolean) => {
      reduceMotion.current = enabled;
      if (enabled) {
        scale.stopAnimation();
        scale.setValue(1);
      }
    };
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        preferenceChanged = true;
        updatePreference(enabled);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        // A live change takes precedence over an older async query.
        if (mounted && !preferenceChanged) updatePreference(enabled);
      },
      () => {}, // Keep motion disabled if the preference can't be read.
    );
    return () => {
      mounted = false;
      subscription.remove();
      scale.stopAnimation();
    };
  }, [scale]);

  const animatePress = (pressed: boolean) => {
    scale.stopAnimation();
    if (reduceMotion.current) {
      scale.setValue(1);
      return;
    }
    const useNativeDriver = Platform.OS !== "web";
    if (pressed) {
      Animated.timing(scale, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver,
        isInteraction: false,
      }).start();
    } else {
      Animated.spring(scale, {
        toValue: 1,
        stiffness: 300,
        damping: 20,
        mass: 0.6,
        useNativeDriver,
        isInteraction: false,
      }).start();
    }
  };

  return (
    <AnimatedPressable
      {...props}
      // Replace default ripple/fade feedback without changing tab colors.
      pressOpacity={1}
      android_ripple={{ ...props.android_ripple, color: "transparent" }}
      style={[style, { transform: [{ scale }] }]}
      onPressIn={(event) => {
        animatePress(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // Pressable also fires this when a touch leaves or is cancelled.
        animatePress(false);
        onPressOut?.(event);
      }}
    />
  );
}
