import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useThemeStore } from "@/store/useThemeStore";

export default function NotFoundScreen() {
  const { theme } = useThemeStore();

  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View
        style={[
          styles.container,
          { backgroundColor: theme.background },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>
          This screen does not exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: theme.primary }]}>
            Go to home screen!
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {},
});
