import * as Notifications from "expo-notifications";
import {
  Stack,
  useRouter,
} from "expo-router";
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AuthProvider,
  useAuth,
} from "../contexts/AuthContext";
import { RequestsProvider } from "../contexts/RequestsContext";

function NotificationNavigationHandler() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [
    pendingSessionId,
    setPendingSessionId,
  ] = useState<string | null>(null);

  const lastNotificationId =
    useRef<string | null>(null);

  useEffect(() => {
    function receiveNotification(
      response: Notifications.NotificationResponse
    ) {
      const notificationId =
        response.notification.request.identifier;

      if (
        lastNotificationId.current ===
        notificationId
      ) {
        return;
      }

      const data =
        response.notification.request.content
          .data ?? {};

      const sessionId = data.sessionId;
      const notificationType = data.type;

      if (
        notificationType !==
          "session-reminder" ||
        typeof sessionId !== "string" ||
        sessionId.trim() === ""
      ) {
        return;
      }

      lastNotificationId.current =
        notificationId;

      /*
       * On conserve la séance jusqu’à ce que
       * Firebase ait restauré la connexion.
       */
      setPendingSessionId(sessionId);
    }

    async function checkLastNotification() {
      try {
        const response =
          await Notifications
            .getLastNotificationResponseAsync();

        if (response) {
          receiveNotification(response);
        }
      } catch (error) {
        console.error(
          "Impossible de lire la notification :",
          error
        );
      }
    }

    checkLastNotification();

    const subscription =
      Notifications
        .addNotificationResponseReceivedListener(
          receiveNotification
        );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    /*
     * On attend la fin du chargement Firebase.
     */
    if (
      loading ||
      !user ||
      !pendingSessionId
    ) {
      return;
    }

    const sessionId = pendingSessionId;

    setPendingSessionId(null);

    router.push({
      pathname: "/session/[id]",
      params: {
        id: sessionId,
      },
    });

    Notifications
      .clearLastNotificationResponseAsync()
      .catch((error) => {
        console.warn(
          "Impossible d’effacer la notification :",
          error
        );
      });
  }, [
    loading,
    user,
    pendingSessionId,
    router,
  ]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RequestsProvider>
        <NotificationNavigationHandler />

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
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
            name="session/[id]"
            options={{
              headerShown: true,
              title: "Détails de la séance",
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