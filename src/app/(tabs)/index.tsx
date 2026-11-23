import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    useEffect,
    useState,
} from "react";
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
    getUserProfile,
    ProfileData,
} from "../../services/profileService";
import {
    colors,
    radius,
    shadows,
    spacing,
} from "../../theme";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { requests, loading: requestsLoading } =
    useRequests();

  const [profile, setProfile] =
    useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] =
    useState(true);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const userProfile =
          await getUserProfile(user.uid);

        setProfile(userProfile);
      } catch (error) {
        console.error(error);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  const pendingRequests = requests.filter(
    (request) =>
      request.receiverId === user?.uid &&
      request.status === "pending"
  ).length;

  const acceptedSessions = requests.filter(
    (request) =>
      request.status === "accepted"
  ).length;

  if (profileLoading || requestsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Chargement de l’accueil...
        </Text>
      </View>
    );
  }

  const firstname =
    profile?.firstname ||
    user?.displayName ||
    "Sportif";

  const gym =
    profile?.gym || "Salle non renseignée";

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>
          Bonjour {firstname} 👋
        </Text>

        <View style={styles.gymRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={colors.textMuted}
          />

          <Text style={styles.gymText}>
            {gym}
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>
          Mon activité
        </Text>

        <View style={styles.statistics}>
          <View style={styles.statistic}>
            <View style={styles.requestIcon}>
              <Ionicons
                name="mail-outline"
                size={24}
                color={colors.warning}
              />
            </View>

            <Text style={styles.statisticNumber}>
              {pendingRequests}
            </Text>

            <Text style={styles.statisticLabel}>
              {pendingRequests > 1
                ? "demandes à traiter"
                : "demande à traiter"}
            </Text>
          </View>

          <View style={styles.verticalDivider} />

          <View style={styles.statistic}>
            <View style={styles.sessionIcon}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={colors.success}
              />
            </View>

            <Text style={styles.statisticNumber}>
              {acceptedSessions}
            </Text>

            <Text style={styles.statisticLabel}>
              {acceptedSessions > 1
                ? "séances confirmées"
                : "séance confirmée"}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.actionsTitle}>
        Que souhaitez-vous faire ?
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.mainAction,
          pressed && styles.pressed,
        ]}
        onPress={() =>
          router.push("/(tabs)/membres")
        }
      >
        <View style={styles.mainActionIcon}>
          <Ionicons
            name="people"
            size={28}
            color={colors.white}
          />
        </View>

        <View style={styles.actionInformation}>
          <Text style={styles.mainActionTitle}>
            Découvrir les membres
          </Text>

          <Text style={styles.mainActionText}>
            Trouvez votre prochain partenaire sportif
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={24}
          color={colors.white}
        />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.secondaryAction,
          pressed && styles.pressed,
        ]}
        onPress={() =>
          router.push("/(tabs)/demandes")
        }
      >
        <View style={styles.secondaryActionIcon}>
          <Ionicons
            name="mail-outline"
            size={25}
            color={colors.primary}
          />
        </View>

        <View style={styles.actionInformation}>
          <Text style={styles.secondaryActionTitle}>
            Voir mes demandes
          </Text>

          <Text style={styles.secondaryActionText}>
            Consultez les propositions reçues et envoyées
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={23}
          color={colors.primary}
        />
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.secondaryAction,
          pressed && styles.pressed,
        ]}
        onPress={() =>
          router.push("/(tabs)/seances")
        }
      >
        <View style={styles.secondaryActionIcon}>
          <Ionicons
            name="calendar-outline"
            size={25}
            color={colors.primary}
          />
        </View>

        <View style={styles.actionInformation}>
          <Text style={styles.secondaryActionTitle}>
            Voir mes séances
          </Text>

          <Text style={styles.secondaryActionText}>
            Retrouvez vos rendez-vous confirmés
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={23}
          color={colors.primary}
        />
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

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  welcomeSection: {
    marginBottom: spacing.xl,
  },

  welcomeText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
  },

  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },

  gymText: {
    color: colors.textMuted,
    fontSize: 16,
    marginLeft: spacing.xs,
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
  },

  sectionTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },

  statistics: {
    flexDirection: "row",
    alignItems: "center",
  },

  statistic: {
    flex: 1,
    alignItems: "center",
  },

  requestIcon: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.round,
    padding: spacing.md,
  },

  sessionIcon: {
    backgroundColor: colors.successLight,
    borderRadius: radius.round,
    padding: spacing.md,
  },

  statisticNumber: {
    color: colors.primary,
    fontSize: 25,
    fontWeight: "bold",
    marginTop: spacing.sm,
  },

  statisticLabel: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  verticalDivider: {
    width: 1,
    height: 85,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.sm,
  },

  actionsTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },

  mainAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  mainActionIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },

  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  secondaryActionIcon: {
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },

  actionInformation: {
    flex: 1,
    marginHorizontal: spacing.md,
  },

  mainActionTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "bold",
  },

  mainActionText: {
    color: "#DDEAF7",
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },

  secondaryActionTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "bold",
  },

  secondaryActionText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: spacing.xs,
  },

  pressed: {
    opacity: 0.8,
  },
});