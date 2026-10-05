import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform, type ColorValue } from "react-native";
import AnimatedTabButton from "../../components/AnimatedTabButton";
import { useThemeStore } from "../../store/useThemeStore";

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  focused: boolean;
  color: ColorValue;
  size: number;
  active: IoniconName;
  inactive: IoniconName;
}

function TabIcon({ focused, color, size, active, inactive }: TabIconProps) {
  return <Ionicons name={focused ? active : inactive} size={size} color={color} />;
}

export default function TabLayout() {
  const { theme } = useThemeStore();
  return (
    <Tabs
      screenOptions={{
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.secondary,
          height: Platform.OS === "ios" ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 24 : 8,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="home"
              inactive="home-outline"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              active="list"
              inactive="list-outline"
            />
          ),
        }}
      />
    </Tabs>
  );
}
