import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

import splashLogo from "@/assets/images/tracker-logo.png";

export default function AppSplash() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }}>
        <Image
          source={splashLogo}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  logo: {
    width: 200,
    height: 200,
  },
});