import { Ionicons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useRouter,
} from "expo-router";
import {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useRequests } from "../../contexts/RequestsContext";
import {
  cancelSessionReminder,
  getAllSessionReminders,
  scheduleSessionReminder,
  SessionReminder,
  updateSessionReminder,
} from "../../services/notificationService";
import {
  colors,
  radius,
  shadows,
  spacing,
} from "../../theme";
import { TrainingRequest } from "../../types/trainingRequest";

function createSessionDate(
  dateValue: string,
  timeValue: string
): Date | null {
  const dateParts = dateValue
    .trim()
    .split("/")
    .map(Number);

  const timeParts = timeValue
    .trim()
    .split(":")
    .map(Number);

  if (
    dateParts.length !== 3 ||
    timeParts.length !== 2
  ) {
    return null;
  }

  const [day, month, year] = dateParts;
  const [hours, minutes] = timeParts;

  const date = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0
  );

  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes;

  return isValid ? date : null;
}

function isCompleteSession(
  request: TrainingRequest
) {
  return Boolean(
    request.id &&
      request.senderId &&
      request.senderName &&
      request.receiverId &&
      request.receiverName &&
      request.activity?.trim() &&
      request.date?.trim() &&
      request.startTime?.trim() &&
      request.endTime?.trim()
  );
}

export default function SessionsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    requests,
    loading,
    error,
  } = useRequests();

  const [reminders, setReminders] = useState<
    Record<string, SessionReminder>
  >({});

  const [remindersLoading, setRemindersLoading] =
    useState(true);

  const [workingSessionId, setWorkingSessionId] =
    useState<string | null>(null);

  const [reminderSession, setReminderSession] =
    useState<TrainingRequest | null>(null);

  const acceptedRequests = requests.filter(
    (request) =>
      request.status === "accepted" &&
      isCompleteSession(request) &&
      (
        request.senderId === user?.uid ||
        request.receiverId === user?.uid
      )
  );

  const currentTime = Date.now();

  const upcomingSessions = acceptedRequests
    .filter((request) => {
      const sessionEnd = createSessionDate(
        request.date,
        request.endTime
      );

      return (
        sessionEnd !== null &&
        sessionEnd.getTime() >= currentTime
      );
    })
    .sort((firstSession, secondSession) => {
      const firstDate = createSessionDate(
        firstSession.date,
        firstSession.startTime
      );

      const secondDate = createSessionDate(
        secondSession.date,
        secondSession.startTime
      );

      return (
        (firstDate?.getTime() ?? 0) -
        (secondDate?.getTime() ?? 0)
      );
    });

  const pastSessions = acceptedRequests
    .filter((request) => {
      const sessionEnd = createSessionDate(
        request.date,
        request.endTime
      );

      return (
        sessionEnd !== null &&
        sessionEnd.getTime() < currentTime
      );
    })
    .sort((firstSession, secondSession) => {
      const firstDate = createSessionDate(
        firstSession.date,
        firstSession.startTime
      );

      const secondDate = createSessionDate(
        secondSession.date,
        secondSession.startTime
      );

      return (
        (secondDate?.getTime() ?? 0) -
        (firstDate?.getTime() ?? 0)
      );
    });

  const sessionSections = [
    ...(upcomingSessions.length > 0
      ? [
          {
            title: "Séances à venir",
            data: upcomingSessions,
          },
        ]
      : []),

    ...(pastSessions.length > 0
      ? [
          {
            title: "Séances passées",
            data: pastSessions,
          },
        ]
      : []),
  ];

  const loadReminders = useCallback(async () => {
    try {
      setRemindersLoading(true);

      const storedReminders =
        await getAllSessionReminders();

      const remindersBySession =
        storedReminders.reduce<
          Record<string, SessionReminder>
        >((result, reminder) => {
          result[reminder.sessionId] = reminder;
          return result;
        }, {});

      setReminders(remindersBySession);
    } catch (loadError) {
      console.error(
        "Erreur pendant le chargement des rappels :",
        loadError
      );
    } finally {
      setRemindersLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders])
  );

  const getPartnerName = (
    request: TrainingRequest
  ) => {
    const isSender =
      request.senderId === user?.uid;

    return isSender
      ? request.receiverName
      : request.senderName;
  };

  const getErrorMessage = (
    unknownError: unknown
  ) => {
    if (unknownError instanceof Error) {
      return unknownError.message;
    }

    return "Une erreur inattendue est survenue.";
  };

  const getDelayLabel = (
    minutesBefore: number
  ) => {
    if (minutesBefore === 24 * 60) {
      return "24 heures avant";
    }

    if (minutesBefore === 2 * 60) {
      return "2 heures avant";
    }

    if (minutesBefore === 60) {
      return "1 heure avant";
    }

    if (minutesBefore === 30) {
      return "30 minutes avant";
    }

    return `${minutesBefore} minutes avant`;
  };

  const formatReminderDate = (
    reminderDate: string
  ) => {
    const date = new Date(reminderDate);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPastSession = (
    session: TrainingRequest
  ) => {
    const sessionEnd = createSessionDate(
      session.date,
      session.endTime
    );

    return (
      sessionEnd === null ||
      sessionEnd.getTime() < Date.now()
    );
  };

  const saveReminder = async (
    session: TrainingRequest,
    minutesBefore: number
  ) => {
    if (isPastSession(session)) {
      Alert.alert(
        "Séance terminée",
        "Vous ne pouvez pas créer un rappel pour une séance passée."
      );

      return;
    }

    const partnerName =
      getPartnerName(session);

    const existingReminder =
      reminders[session.id];

    try {
      setWorkingSessionId(session.id);

      const reminderOptions = {
        sessionId: session.id,
        activity: session.activity,
        partnerName,
        sessionDate: session.date,
        sessionTime: session.startTime,
        minutesBefore,
      };

      const savedReminder = existingReminder
        ? await updateSessionReminder(
            reminderOptions
          )
        : await scheduleSessionReminder(
            reminderOptions
          );

      setReminders((currentReminders) => ({
        ...currentReminders,
        [session.id]: savedReminder,
      }));

      Alert.alert(
        existingReminder
          ? "Rappel modifié"
          : "Rappel créé",
        `Vous recevrez une notification ${getDelayLabel(
          minutesBefore
        )} la séance.`
      );
    } catch (saveError) {
      console.error(
        "Erreur pendant la programmation du rappel :",
        saveError
      );

      Alert.alert(
        "Rappel impossible",
        getErrorMessage(saveError)
      );
    } finally {
      setWorkingSessionId(null);
    }
  };

  const showReminderChoices = (
    session: TrainingRequest
  ) => {
    if (isPastSession(session)) {
      Alert.alert(
        "Séance terminée",
        "Il est impossible de créer un rappel pour cette séance."
      );

      return;
    }

    setReminderSession(session);
  };

  const chooseReminderDelay = (
    minutesBefore: number
  ) => {
    if (!reminderSession) {
      return;
    }

    const selectedSession =
      reminderSession;

    setReminderSession(null);

    saveReminder(
      selectedSession,
      minutesBefore
    );
  };

  const removeReminder = (
    session: TrainingRequest
  ) => {
    Alert.alert(
      "Annuler le rappel",
      "Voulez-vous vraiment supprimer ce rappel ?",
      [
        {
          text: "Non",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              setWorkingSessionId(session.id);

              await cancelSessionReminder(
                session.id
              );

              setReminders(
                (currentReminders) => {
                  const updatedReminders = {
                    ...currentReminders,
                  };

                  delete updatedReminders[
                    session.id
                  ];

                  return updatedReminders;
                }
              );

              Alert.alert(
                "Rappel annulé",
                "La notification a bien été supprimée."
              );
            } catch (cancelError) {
              console.error(
                "Erreur pendant l’annulation du rappel :",
                cancelError
              );

              Alert.alert(
                "Annulation impossible",
                getErrorMessage(cancelError)
              );
            } finally {
              setWorkingSessionId(null);
            }
          },
        },
      ]
    );
  };

  const openSessionDetails = (
    sessionId: string
  ) => {
    router.push({
      pathname: "/session/[id]",
      params: {
        id: sessionId,
      },
    });
  };

  const renderSession = ({
    item,
  }: {
    item: TrainingRequest;
  }) => {
    const partnerName = getPartnerName(item);
    const reminder = reminders[item.id];

    const sessionIsPast =
      isPastSession(item);

    const isWorking =
      workingSessionId === item.id;

    return (
      <View
        style={[
          styles.card,
          sessionIsPast && styles.pastCard,
        ]}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              sessionIsPast &&
                styles.pastIconContainer,
            ]}
          >
            <Ionicons
              name="barbell-outline"
              size={25}
              color={
                sessionIsPast
                  ? colors.textMuted
                  : colors.secondaryDark
              }
            />
          </View>

          <View style={styles.headerInformation}>
            <Text
              style={[
                styles.activity,
                sessionIsPast &&
                  styles.pastActivity,
              ]}
            >
              {item.activity}
            </Text>

            <View style={styles.confirmedRow}>
              <Ionicons
                name={
                  sessionIsPast
                    ? "time-outline"
                    : "checkmark-circle"
                }
                size={16}
                color={
                  sessionIsPast
                    ? colors.textMuted
                    : colors.success
                }
              />

              <Text
                style={[
                  styles.confirmed,
                  sessionIsPast &&
                    styles.pastStatus,
                ]}
              >
                {sessionIsPast
                  ? "Séance terminée"
                  : "Séance confirmée"}
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

        {reminder && !sessionIsPast && (
          <View style={styles.reminderInformation}>
            <View style={styles.reminderIcon}>
              <Ionicons
                name="notifications"
                size={21}
                color={colors.secondaryDark}
              />
            </View>

            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>
                Rappel activé
              </Text>

              <Text style={styles.reminderText}>
                {getDelayLabel(
                  reminder.minutesBefore
                )}
              </Text>

              <Text style={styles.reminderDate}>
                Notification prévue le{" "}
                {formatReminderDate(
                  reminder.reminderDate
                )}
              </Text>
            </View>
          </View>
        )}

        {!sessionIsPast && (
          <>
            {remindersLoading ? (
              <ActivityIndicator
                color={colors.secondary}
                style={styles.reminderLoader}
              />
            ) : (
              <View style={styles.reminderActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.reminderButton,
                    reminder &&
                      styles.modifyReminderButton,
                    pressed &&
                      styles.pressedElement,
                    isWorking &&
                      styles.disabledButton,
                  ]}
                  onPress={() =>
                    showReminderChoices(item)
                  }
                  disabled={isWorking}
                >
                  {isWorking ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.white}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          reminder
                            ? "create-outline"
                            : "notifications-outline"
                        }
                        size={19}
                        color={colors.white}
                      />

                      <Text
                        style={
                          styles.reminderButtonText
                        }
                      >
                        {reminder
                          ? "Modifier le rappel"
                          : "Créer un rappel"}
                      </Text>
                    </>
                  )}
                </Pressable>

                {reminder && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.cancelReminderButton,
                      pressed &&
                        styles.pressedElement,
                      isWorking &&
                        styles.disabledButton,
                    ]}
                    onPress={() =>
                      removeReminder(item)
                    }
                    disabled={isWorking}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={19}
                      color={colors.danger}
                    />

                    <Text
                      style={
                        styles.cancelReminderText
                      }
                    >
                      Annuler
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.detailsLink,
            pressed && styles.pressedElement,
          ]}
          onPress={() =>
            openSessionDetails(item.id)
          }
          accessibilityRole="button"
          accessibilityLabel={`Voir la séance de ${item.activity}`}
        >
          <Text style={styles.detailsLinkText}>
            Voir les détails
          </Text>

          <Ionicons
            name="chevron-forward"
            size={19}
            color={colors.primary}
          />
        </Pressable>
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
            pressed && styles.pressedElement,
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

      <SectionList
        sections={sessionSections}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {section.title}
            </Text>

            <View style={styles.sectionCount}>
              <Text style={styles.sectionCountText}>
                {section.data.length}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
      />

      <Modal
        visible={reminderSession !== null}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setReminderSession(null)
        }
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={27}
                  color={colors.secondaryDark}
                />
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() =>
                  setReminderSession(null)
                }
              >
                <Ionicons
                  name="close"
                  size={25}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

            <Text style={styles.modalTitle}>
              {reminderSession &&
              reminders[reminderSession.id]
                ? "Modifier le rappel"
                : "Créer un rappel"}
            </Text>

            <Text style={styles.modalSubtitle}>
              Quand souhaitez-vous recevoir la
              notification ?
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.delayButton,
                pressed &&
                  styles.pressedElement,
              ]}
              onPress={() =>
                chooseReminderDelay(30)
              }
            >
              <View style={styles.delayIcon}>
                <Ionicons
                  name="timer-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.delayButtonText}
              >
                30 minutes avant
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.delayButton,
                pressed &&
                  styles.pressedElement,
              ]}
              onPress={() =>
                chooseReminderDelay(60)
              }
            >
              <View style={styles.delayIcon}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.delayButtonText}
              >
                1 heure avant
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.delayButton,
                pressed &&
                  styles.pressedElement,
              ]}
              onPress={() =>
                chooseReminderDelay(2 * 60)
              }
            >
              <View style={styles.delayIcon}>
                <Ionicons
                  name="alarm-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.delayButtonText}
              >
                2 heures avant
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.delayButton,
                pressed &&
                  styles.pressedElement,
              ]}
              onPress={() =>
                chooseReminderDelay(24 * 60)
              }
            >
              <View style={styles.delayIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <Text
                style={styles.delayButtonText}
              >
                24 heures avant
              </Text>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textMuted}
              />
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.modalCancelButton,
                pressed &&
                  styles.pressedElement,
              ]}
              onPress={() =>
                setReminderSession(null)
              }
            >
              <Text
                style={styles.modalCancelText}
              >
                Annuler
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    marginBottom: spacing.md,
  },

  list: {
    paddingBottom: spacing.xxxl,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "bold",
  },

  sectionCount: {
    minWidth: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondaryLight,
    borderRadius: 13,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
  },

  sectionCountText: {
    color: colors.secondaryDark,
    fontSize: 13,
    fontWeight: "bold",
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  pastCard: {
    opacity: 0.82,
  },

  pressedElement: {
    opacity: 0.75,
  },

  disabledButton: {
    opacity: 0.6,
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

  pastIconContainer: {
    backgroundColor: colors.background,
  },

  headerInformation: {
    flex: 1,
  },

  activity: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
  },

  pastActivity: {
    color: colors.textMuted,
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

  pastStatus: {
    color: colors.textMuted,
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

  reminderInformation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },

  reminderIcon: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 21,
  },

  reminderContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  reminderTitle: {
    color: colors.secondaryDark,
    fontSize: 15,
    fontWeight: "bold",
  },

  reminderText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 3,
  },

  reminderDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },

  reminderActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  reminderButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
  },

  modifyReminderButton: {
    backgroundColor: colors.primary,
  },

  reminderButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },

  cancelReminderButton: {
    minHeight: 46,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },

  cancelReminderText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },

  reminderLoader: {
    marginTop: spacing.lg,
  },

  detailsLink: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: spacing.lg,
    paddingVertical: spacing.xs,
  },

  detailsLinkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "bold",
    marginRight: spacing.xs,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    padding: spacing.lg,
  },

  modalContainer: {
    width: "100%",
    maxWidth: 450,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalIcon: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondaryLight,
    borderRadius: 26,
  },

  modalCloseButton: {
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: 21,
  },

  modalTitle: {
    color: colors.primary,
    fontSize: 23,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  delayButton: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },

  delayIcon: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 20,
    marginRight: spacing.md,
  },

  delayButtonText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },

  modalCancelButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },

  modalCancelText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "bold",
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