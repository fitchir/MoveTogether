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

export default function SessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    requests,
    loading,
    error,
  } = useRequests();

  const acceptedRequests = requests.filter(
    (request) => request.status === "accepted"
  );

  const renderSession = ({
    item,
  }: {
    item: TrainingRequest;
  }) => {
    const isSender =
      item.senderId === user?.uid;

    const partnerName = isSender
      ? item.receiverName
      : item.senderName;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.pressedCard,
        ]}
        onPress={() =>
          router.push({
            pathname: "/session/[id]",
            params: {
              id: item.id,
            },
          })
        }
        accessibilityRole="button"
        accessibilityLabel={
          `Voir la séance de ${item.activity}`
        }
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons
              name="barbell-outline"
              size={25}
              color={colors.secondaryDark}
            />
          </View>

          <View style={styles.headerInformation}>
            <Text style={styles.activity}>
              {item.activity}
            </Text>

            <View style={styles.confirmedRow}>
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={colors.success}
              />

              <Text style={styles.confirmed}>
                Séance confirmée
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.informationRow}>
          <View style={styles.informationIcon}>
            <Ionicons
              name="person-outline"
              size={21}
              color={colors.primary}
            />
          </View>

          <View style={styles.informationContent}>
            <Text style={styles.label}>
              Partenaire
            </Text>

            <Text style={styles.value}>
              {partnerName}
            </Text>
          </View>
        </View>

        <View style={styles.informationRow}>
          <View style={styles.informationIcon}>
            <Ionicons
              name="calendar-outline"
              size={21}
              color={colors.primary}
            />
          </View>

          <View style={styles.informationContent}>
            <Text style={styles.label}>
              Date
            </Text>

            <Text style={styles.value}>
              {item.date}
            </Text>
          </View>
        </View>

        <View style={styles.informationRow}>
          <View style={styles.informationIcon}>
            <Ionicons
              name="time-outline"
              size={21}
              color={colors.primary}
            />
          </View>

          <View style={styles.informationContent}>
            <Text style={styles.label}>
              Horaire
            </Text>

            <Text style={styles.value}>
              {item.startTime} - {item.endTime}
            </Text>
          </View>
        </View>

        {item.message.trim() !== "" && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>
              Message
            </Text>

            <Text style={styles.message}>
              {item.message}
            </Text>
          </View>
        )}

        <View style={styles.detailsLink}>
          <Text style={styles.detailsLinkText}>
            Voir les détails
          </Text>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.primary}
          />
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Chargement des séances...
        </Text>
      </View>
    );
  }

  if (error !== "") {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="cloud-offline-outline"
          size={55}
          color={colors.danger}
        />

        <Text style={styles.errorTitle}>
          Une erreur est survenue
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  if (acceptedRequests.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="calendar-outline"
          size={60}
          color={colors.textMuted}
        />

        <Text style={styles.emptyTitle}>
          Aucune séance
        </Text>

        <Text style={styles.emptyText}>
          Les demandes acceptées apparaîtront
          automatiquement ici.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.membersButton,
            pressed && styles.pressedCard,
          ]}
          onPress={() =>
            router.push("/(tabs)/membres")
          }
        >
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
        Mes séances
      </Text>

      <Text style={styles.subtitle}>
        Retrouvez vos rendez-vous confirmés
      </Text>

      <FlatList
        data={acceptedRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
    marginBottom: spacing.lg,
  },

  list: {
    paddingBottom: spacing.xxxl,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  pressedCard: {
    opacity: 0.8,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconContainer: {
    width: 54,
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondaryLight,
    borderRadius: 27,
    marginRight: spacing.md,
  },

  headerInformation: {
    flex: 1,
  },

  activity: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },

  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },

  confirmed: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },

  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },

  informationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  informationIcon: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },

  informationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  label: {
    color: colors.textMuted,
    fontSize: 13,
  },

  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 2,
  },

  messageContainer: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
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

  detailsLink: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: spacing.lg,
  },

  detailsLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
    marginRight: spacing.xs,
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.md,
  },

  errorTitle: {
    color: colors.primary,
    fontSize: 21,
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

  emptyTitle: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 23,
    marginTop: spacing.sm,
  },

  membersButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  membersButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },
});