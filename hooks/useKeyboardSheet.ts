import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardEvent,
  LayoutChangeEvent,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useKeyboardSheet(visible: boolean) {
  const { top } = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const fullWindowHeight = useRef(Dimensions.get("window").height);
  const [windowHeight, setWindowHeight] = useState(fullWindowHeight.current);
  const [modal, setModal] = useState({ height: 0, fullHeight: 0 });
  const [sheetHeight, setSheetHeight] = useState(0);
  const [keyboard, setKeyboard] = useState({ height: 0, duration: 0 });

  useEffect(() => {
    if (!visible) {
      setModal({ height: 0, fullHeight: 0 });
      setSheetHeight(0);
      setKeyboard({ height: 0, duration: 0 });
      translateY.setValue(0);
      return;
    }

    const updateWindow = () => {
      const height = Dimensions.get("window").height;
      fullWindowHeight.current = Math.max(fullWindowHeight.current, height);
      setWindowHeight(height);
    };
    const show = (event: KeyboardEvent) => {
      updateWindow();
      setKeyboard({
        height: Platform.OS === "ios"
          ? Math.max(0, Math.min(
            event.endCoordinates.height,
            fullWindowHeight.current - event.endCoordinates.screenY
          ))
          : event.endCoordinates.height,
        duration: event.duration || 200,
      });
    };
    const hide = (event: KeyboardEvent) => {
      updateWindow();
      setKeyboard({ height: 0, duration: event.duration || 200 });
    };
    const subscriptions = [
      Dimensions.addEventListener("change", updateWindow),
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow",
        show
      ),
      Keyboard.addListener(
        Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
        hide
      ),
    ];
    updateWindow();
    setKeyboard({ height: Keyboard.metrics()?.height ?? 0, duration: 0 });

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      translateY.stopAnimation();
      translateY.setValue(0);
      Keyboard.dismiss();
    };
  }, [visible, translateY]);

  useEffect(() => {
    if (!visible) return;

    // Android Modal uses a separate Dialog window. Its measured resize takes
    // precedence over Dimensions, which can still describe the main Activity.
    const height = modal.height || windowHeight;
    const fullHeight = modal.fullHeight || fullWindowHeight.current;
    const resized = height + keyboard.height <= fullHeight;
    const resizeAmount = Math.max(0, fullHeight - height);
    const overlap = resized ? 0 : Math.max(0, keyboard.height - resizeAmount);
    // A resized window can be shorter than the sheet. Keep its top reachable
    // rather than allowing flex-end to place the inputs above the screen.
    const maxLift = height - sheetHeight - top - 8;

    const animation = Animated.timing(translateY, {
      toValue: -Math.min(overlap, maxLift),
      duration: keyboard.duration,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [visible, windowHeight, modal, sheetHeight, keyboard, top, translateY]);

  const onContainerLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setModal((previous) => ({
      height,
      fullHeight: Math.max(previous.fullHeight, height),
    }));
  };

  const onSheetLayout = (event: LayoutChangeEvent) => {
    setSheetHeight(event.nativeEvent.layout.height);
  };

  return {
    translateY,
    onContainerLayout,
    onSheetLayout,
  };
}
