import { Ionicons } from "@expo/vector-icons";
import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
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

export default function SessionDetailsScreen() {
  const router = useRouter();

  const { id } = useLocalSearchParams<{
    id: string | string[];
  }>();

  const { user } = useAuth();
  const { requests, loading } = useRequests();

  const sessionId = Array.isArray(id)
    ? id[0]
    : id;

  const session = requests.find(
    (request) =>
      request.id === sessionId &&
      request.status === "accepted"
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Chargement de la séance...
        </Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="calendar-outline"
          size={60}
          color={colors.textMuted}
        />

        <Text style={styles.errorTitle}>
          Séance introuvable
        </Text>

        <Text style={styles.errorText}>
          Cette séance n’existe pas ou n’est plus
          accessible.
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Retour
          </Text>
        </Pressable>
      </View>
    );
  }

  const isSender =
    session.senderId === user?.uid;

  const partnerId = isSender
    ? session.receiverId
    : session.senderId;

  const partnerName = isSender
    ? session.receiverName
    : session.senderName;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.confirmation}>
        <View style={styles.confirmationIcon}>
          <Ionicons
            name="checkmark"
            size={38}
            color={colors.white}
          />
        </View>

        <Text style={styles.confirmationTitle}>
          Séance confirmée
        </Text>

        <Text style={styles.confirmationText}>
          Votre rendez-vous sportif est organisé.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.activity}>
          {session.activity}
        </Text>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="person-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.detailInformation}>
            <Text style={styles.label}>
              Partenaire
            </Text>

            <Text style={styles.value}>
              {partnerName}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="calendar-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.detailInformation}>
            <Text style={styles.label}>Date</Text>

            <Text style={styles.value}>
              {session.date}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="time-outline"
              size={23}
              color={colors.primary}
            />
          </View>

          <View style={styles.detailInformation}>
            <Text style={styles.label}>
              Horaire
            </Text>

            <Text style={styles.value}>
              {session.startTime} -{" "}
              {session.endTime}
            </Text>
          </View>
        </View>

        {session.message.trim() !== "" && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>
              Message associé
            </Text>

            <Text style={styles.message}>
              {session.message}
            </Text>
          </View>
        )}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.chatButton,
          pressed && styles.pressed,
        ]}
        onPress={() =>
          router.push({
            pathname: "/chat/[id]",
            params: {
              id: partnerId,
            },
          })
        }
      >
        <Ionicons
          name="chatbubble-outline"
          size={21}
          color={colors.white}
        />

        <Text style={styles.chatButtonText}>
          Écrire à {partnerName}
        </Text>
      </Pressable>

      <Pressable
        style={styles.profileButton}
        onPress={() =>
          router.push({
            pathname: "/member/[id]",
            params: {
              id: partnerId,
            },
          })
        }
      >
        <Ionicons
          name="person-outline"
          size={21}
          color={colors.primary}
        />

        <Text style={styles.profileButtonText}>
          Voir le profil
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },

  confirmation: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  confirmationIcon: {
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 36,
  },

  confirmationTitle: {
    color: colors.primary,
    fontSize: 27,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  confirmationText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
  },

  activity: {
    color: colors.secondaryDark,
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
  },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },

  detailInformation: {
    flex: 1,
    marginLeft: spacing.md,
  },

  label: {
    color: colors.textMuted,
    fontSize: 13,
  },

  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    marginTop: spacing.xs,
  },

  messageContainer: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  messageLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },

  message: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.xs,
  },

  chatButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    marginTop: spacing.xl,
  },

  chatButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },

  profileButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    marginTop: spacing.md,
  },

  profileButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },

  backButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  backButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },

  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  errorTitle: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  errorText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  pressed: {
    opacity: 0.8,
  },
});