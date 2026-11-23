import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "../../theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontWeight: "bold",
        },

        tabBarActiveTintColor: colors.secondary,
        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: {
          height: 68,
          paddingTop: 7,
          paddingBottom: 9,
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="membres"
        options={{
          title: "Membres",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="people-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="demandes"
        options={{
          title: "Demandes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="mail-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="seances"
        options={{
          href: null,
          title: "Mes séances",
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="chatbubble-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}