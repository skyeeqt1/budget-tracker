import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { Platform, type ColorValue } from "react-native";
import AnimatedTabButton from "../../components/AnimatedTabButton";

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
  return (
    <Tabs
      screenOptions={{
        tabBarButton: (props) => <AnimatedTabButton {...props} />,
        tabBarActiveTintColor: "#9381FF",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarStyle: {
          backgroundColor: "#F8F7FF",
          borderTopColor: "#E2E0ED",
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
