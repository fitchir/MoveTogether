import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  RequestStatus,
  TrainingRequest,
} from "../../types/trainingRequest";

type RequestTab = "received" | "sent";

const statusLabels: Record<RequestStatus, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  rejected: "Refusée",
};

export default function RequestsScreen() {
  const { user } = useAuth();

  const {
    requests,
    loading,
    error,
    updateRequestStatus,
  } = useRequests();

  const [selectedTab, setSelectedTab] =
    useState<RequestTab>("received");

  const receivedRequests = requests.filter(
    (request) =>
      request.receiverId === user?.uid
  );

  const sentRequests = requests.filter(
    (request) =>
      request.senderId === user?.uid
  );

  const displayedRequests =
    selectedTab === "received"
      ? receivedRequests
      : sentRequests;

  const pendingReceivedCount =
    receivedRequests.filter(
      (request) => request.status === "pending"
    ).length;

  const handleStatusUpdate = async (
    requestId: string,
    status: RequestStatus
  ) => {
    try {
      await updateRequestStatus(requestId, status);
    } catch (updateError) {
      console.error(updateError);

      Alert.alert(
        "Erreur",
        "La demande n’a pas pu être modifiée."
      );
    }
  };

  const renderRequest = ({
    item,
  }: {
    item: TrainingRequest;
  }) => {
    const isReceived =
      item.receiverId === user?.uid;

    const memberName = isReceived
      ? item.senderName
      : item.receiverName;

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.memberInformation}>
            <Text style={styles.direction}>
              {isReceived
                ? "Demande reçue de"
                : "Demande envoyée à"}
            </Text>

            <Text style={styles.name}>
              {memberName}
            </Text>
          </View>

          <View
            style={[
              styles.status,
              item.status === "pending" &&
                styles.pendingStatus,
              item.status === "accepted" &&
                styles.acceptedStatus,
              item.status === "rejected" &&
                styles.rejectedStatus,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                item.status === "pending" &&
                  styles.pendingStatusText,
                item.status === "accepted" &&
                  styles.acceptedStatusText,
                item.status === "rejected" &&
                  styles.rejectedStatusText,
              ]}
            >
              {statusLabels[item.status]}
            </Text>
          </View>
        </View>

        <View style={styles.activityBadge}>
          <Text style={styles.activity}>
            {item.activity}
          </Text>
        </View>

        <View style={styles.informationContainer}>
          <Text style={styles.information}>
            📅 {item.date}
          </Text>

          <Text style={styles.information}>
            🕐 {item.startTime} - {item.endTime}
          </Text>
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

        {item.status === "pending" &&
          isReceived && (
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [
                  styles.acceptButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  handleStatusUpdate(
                    item.id,
                    "accepted"
                  )
                }
              >
                <Text style={styles.buttonText}>
                  Accepter
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.rejectButton,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  handleStatusUpdate(
                    item.id,
                    "rejected"
                  )
                }
              >
                <Text style={styles.buttonText}>
                  Refuser
                </Text>
              </Pressable>
            </View>
          )}

        {item.status === "pending" &&
          !isReceived && (
            <Text style={styles.waitingMessage}>
              En attente de la réponse de{" "}
              {item.receiverName}
            </Text>
          )}
      </View>
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
          Chargement des demandes...
        </Text>
      </View>
    );
  }

  if (error !== "") {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>
          Une erreur est survenue
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Mes demandes
      </Text>

      <Text style={styles.subtitle}>
        Gérez vos propositions de séance
      </Text>

      <View style={styles.tabs}>
        <Pressable
          style={[
            styles.tab,
            selectedTab === "received" &&
              styles.activeTab,
          ]}
          onPress={() =>
            setSelectedTab("received")
          }
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "received" &&
                styles.activeTabText,
            ]}
          >
            Reçues
          </Text>

          {pendingReceivedCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>
                {pendingReceivedCount}
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.tab,
            selectedTab === "sent" &&
              styles.activeTab,
          ]}
          onPress={() => setSelectedTab("sent")}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === "sent" &&
                styles.activeTabText,
            ]}
          >
            Envoyées
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={displayedRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequest}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          displayedRequests.length === 0 &&
            styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              📩
            </Text>

            <Text style={styles.emptyTitle}>
              {selectedTab === "received"
                ? "Aucune demande reçue"
                : "Aucune demande envoyée"}
            </Text>

            <Text style={styles.emptyText}>
              {selectedTab === "received"
                ? "Les propositions envoyées par les autres membres apparaîtront ici."
                : "Découvrez des membres pour proposer une séance."}
            </Text>
          </View>
        }
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

  tabs: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    ...shadows.card,
  },

  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius.sm,
  },

  activeTab: {
    backgroundColor: colors.primary,
  },

  tabText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },

  activeTabText: {
    color: colors.white,
  },

  notificationBadge: {
    minWidth: 21,
    height: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.danger,
    borderRadius: radius.round,
    marginLeft: spacing.sm,
    paddingHorizontal: 5,
  },

  notificationText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },

  list: {
    paddingBottom: spacing.xxxl,
  },

  emptyList: {
    flexGrow: 1,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm,
  },

  memberInformation: {
    flex: 1,
  },

  direction: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },

  name: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },

  status: {
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },

  pendingStatus: {
    backgroundColor: colors.warningLight,
  },

  acceptedStatus: {
    backgroundColor: colors.successLight,
  },

  rejectedStatus: {
    backgroundColor: colors.dangerLight,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  pendingStatusText: {
    color: colors.warning,
  },

  acceptedStatusText: {
    color: colors.success,
  },

  rejectedStatusText: {
    color: "#991B1B",
  },

  activityBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    marginTop: spacing.md,
  },

  activity: {
    color: colors.secondaryDark,
    fontSize: 15,
    fontWeight: "600",
  },

  informationContainer: {
    marginTop: spacing.md,
  },

  information: {
    color: colors.text,
    fontSize: 15,
    marginTop: spacing.xs,
  },

  messageContainer: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
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

  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  acceptButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },

  rejectButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },

  buttonText: {
    color: colors.white,
    fontWeight: "bold",
  },

  waitingMessage: {
    color: colors.warning,
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
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
    color: colors.danger,
    fontSize: 21,
    fontWeight: "bold",
  },

  errorText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingBottom: 70,
  },

  emptyIcon: {
    fontSize: 50,
  },

  emptyTitle: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});