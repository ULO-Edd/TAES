import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

export default function TabsLayout() {
  const { session } = useAuth();

  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home"
              color={color}
              size={size}
              testID="home_nav_tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="scoreboard"
        options={{
          headerShown: false,
          title: "Scoreboard",
          href: !session ? null : "/scoreboard",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="trophy"
              color={color}
              size={size}
              testID="scoreboard_nav_tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="history"
              color={color}
              size={size}
              testID="history_nav_tab"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="customization"
        options={{
          title: "Customization",
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="brush"
              color={color}
              size={size}
              testID="customization_nav_tab"
            />
          ),
        }}
      />
    </Tabs>
  );
}
