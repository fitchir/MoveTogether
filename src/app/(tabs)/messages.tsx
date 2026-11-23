import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useRequests } from "../../contexts/RequestsContext";
import {
  colors,
  radius,
  shadows,
  spacing,
} from "../../theme";
import { TrainingRequest } from "../../types/trainingRequest";

type Conversation = {
  partnerId: string;
  partnerName: string;
  request: TrainingRequest;
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    requests,
    loading,
    error,
  } = useRequests();

  const conversations: Conversation[] = Array.from(
    new Map(
      requests
        .filter(
          (request) =>
            request.status === "accepted"
        )
        .map((request) => {
          const isSender =
            request.senderId === user?.uid;

          const partnerId = isSender
            ? request.receiverId
            : request.senderId;

          const partnerName = isSender
            ? request.receiverName
            : request.senderName;

          return [
            partnerId,
            {
              partnerId,
              partnerName,
              request,
            },
          ] as const;
        })
    ).values()
  );

  const openChat = (
    conversation: Conversation
  ) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: conversation.partnerId,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Chargement des conversations...
        </Text>
      </View>
    );
  }

  if (error !== "") {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="cloud-offline-outline"
          size={56}
          color={colors.danger}
        />

        <Text style={styles.errorTitle}>
          Chargement impossible
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons
            name="chatbubbles-outline"
            size={48}
            color={colors.primary}
          />
        </View>

        <Text style={styles.emptyTitle}>
          Aucune conversation
        </Text>

        <Text style={styles.emptyText}>
          Une conversation apparaîtra lorsqu’une
          demande de séance aura été acceptée.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.membersButton,
            pressed && styles.pressed,
          ]}
          onPress={() =>
            router.push("/(tabs)/membres")
          }
        >
          <Ionicons
            name="people-outline"
            size={20}
            color={colors.white}
          />

          <Text style={styles.membersButtonText}>
            Découvrir les membres
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Messages
      </Text>

      <Text style={styles.subtitle}>
        Discutez avec vos partenaires sportifs
      </Text>

      <Text style={styles.conversationCount}>
        {conversations.length}{" "}
        {conversations.length > 1
          ? "conversations"
          : "conversation"}
      </Text>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.partnerId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.conversation,
              pressed && styles.pressed,
            ]}
            onPress={() => openChat(item)}
            accessibilityRole="button"
            accessibilityLabel={
              `Ouvrir la conversation avec ${item.partnerName}`
            }
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.partnerName
                  .charAt(0)
                  .toUpperCase()}
              </Text>

              <View style={styles.onlineBadge} />
            </View>

            <View style={styles.information}>
              <Text
                style={styles.name}
                numberOfLines={1}
              >
                {item.partnerName}
              </Text>

              <View style={styles.previewRow}>
                <Ionicons
                  name="barbell-outline"
                  size={15}
                  color={colors.textMuted}
                />

                <Text
                  style={styles.preview}
                  numberOfLines={1}
                >
                  Séance de{" "}
                  {item.request.activity}
                </Text>
              </View>
            </View>

            <View style={styles.arrowContainer}>
              <Ionicons
                name="chevron-forward"
                size={21}
                color={colors.primary}
              />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
    marginTop: spacing.xl,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xs,
  },

  conversationCount: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  list: {
    paddingBottom: spacing.xxxl,
  },

  conversation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  avatar: {
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 28,
  },

  avatarText: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "bold",
  },

  onlineBadge: {
    position: "absolute",
    right: 1,
    bottom: 1,
    width: 14,
    height: 14,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: colors.surface,
    borderRadius: 7,
  },

  information: {
    flex: 1,
    marginLeft: spacing.md,
  },

  name: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "bold",
  },

  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },

  preview: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    marginLeft: spacing.xs,
  },

  arrowContainer: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 18,
  },

  pressed: {
    opacity: 0.8,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.md,
  },

  errorTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },

  emptyIconContainer: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 45,
    ...shadows.card,
  },

  emptyTitle: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: "bold",
    marginTop: spacing.lg,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 23,
    marginTop: spacing.sm,
  },

  membersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },

  membersButtonText: {
    color: colors.white,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },
});