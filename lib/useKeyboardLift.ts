import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  type LayoutChangeEvent,
} from "react-native";

/**
 * Shared bottom-sheet keyboard behavior.
 *
 * Lifts the sheet with an animated `translateY` so the keyboard never overlaps
 * the inputs. Detects whether the OS already resized the window
 * (`windowHeight + keyboardHeight <= fullWindowHeight`) and only lifts when it
 * did not. This mirrors the pattern required by the project rules — do not
 * replace with KeyboardAvoidingView on Android.
 *
 * Returns the `translateY` value to attach to an Animated.View, an
 * `onLayout` handler to track the sheet height, and a `resetLift()` helper.
 */
export function useKeyboardLift() {
  const translateY = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(0);
  const fullWindowHeight = useRef(Dimensions.get("window").height);

  useEffect(() => {
    const lift = (keyboardHeight: number) => {
      const windowHeight = Dimensions.get("window").height;
      const alreadyResized =
        keyboardHeight > 0 &&
        windowHeight + keyboardHeight <= fullWindowHeight.current + 10;
      const target = alreadyResized
        ? 0
        : Math.min(
            keyboardHeight,
            Math.max(0, fullWindowHeight.current - sheetHeight.current)
          );
      Animated.timing(translateY, {
        toValue: -target,
        duration: 200,
        useNativeDriver: true,
      }).start();
    };
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) =>
      lift(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => lift(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [translateY]);

  const handleSheetLayout = (e: LayoutChangeEvent) => {
    sheetHeight.current = e.nativeEvent.layout.height;
  };

  const resetLift = () => translateY.setValue(0);

  return { translateY, handleSheetLayout, resetLift };
}
