import { Stack } from "expo-router";

import { AuthProvider } from "../contexts/AuthContext";
import { RequestsProvider } from "../contexts/RequestsContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <RequestsProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />

          <Stack.Screen
            name="member/[id]"
            options={{
              headerShown: true,
              title: "Profil du membre",
              headerStyle: {
                backgroundColor: "#12355B",
              },
              headerTintColor: "#FFFFFF",
            }}
          />

          <Stack.Screen
            name="request/[id]"
            options={{
              headerShown: true,
              title: "Proposer une séance",
              headerStyle: {
                backgroundColor: "#12355B",
              },
              headerTintColor: "#FFFFFF",
            }}
          />

          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: true,
              title: "Conversation",
              headerStyle: {
                backgroundColor: "#12355B",
              },
              headerTintColor: "#FFFFFF",
            }}
          />
        </Stack>
      </RequestsProvider>
    </AuthProvider>
  );
}