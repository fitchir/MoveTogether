import { Ionicons } from "@expo/vector-icons";
import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import {
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useRequests } from "../../contexts/RequestsContext";
import { getMemberById } from "../../services/memberService";
import {
  colors,
  radius,
  shadows,
  spacing,
} from "../../theme";
import { Member } from "../../types/member";

function parseFrenchDate(
  value: string
): Date | null {
  const match = value
    .trim()
    .match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (
    year < 1000 ||
    month < 1 ||
    month > 12 ||
    day < 1
  ) {
    return null;
  }

  const numberOfDaysInMonth = new Date(
    year,
    month,
    0
  ).getDate();

  if (day > numberOfDaysInMonth) {
    return null;
  }

  return new Date(
    year,
    month - 1,
    day
  );
}

function timeToMinutes(
  value: string
): number | null {
  const match = value
    .trim()
    .match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return null;
  }

  return (
    Number(match[1]) * 60 +
    Number(match[2])
  );
}

export default function TrainingRequestScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { id } = useLocalSearchParams<{
    id: string | string[];
  }>();

  const {
    requests,
    addRequest,
  } = useRequests();

  const memberId = Array.isArray(id)
    ? id[0]
    : id;

  const [member, setMember] =
    useState<Member | null>(null);

  const [activity, setActivity] =
    useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] =
    useState("");
  const [endTime, setEndTime] =
    useState("");
  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(true);
  const [sending, setSending] =
    useState(false);
  const [error, setError] = useState("");
  const [
    validationError,
    setValidationError,
  ] = useState("");

  useEffect(() => {
    async function loadMember() {
      if (!memberId) {
        setError(
          "Identifiant du membre manquant."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const firestoreMember =
          await getMemberById(memberId);

        if (!firestoreMember) {
          setError("Membre introuvable.");
          return;
        }

        setMember(firestoreMember);
        setActivity(
          firestoreMember.activity
        );
      } catch (loadError) {
        console.error(loadError);

        setError(
          "Impossible de charger le membre."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMember();
  }, [memberId]);

  const clearValidationError = () => {
    if (validationError !== "") {
      setValidationError("");
    }
  };

  const sendRequest = async () => {
    if (sending) {
      return;
    }

    setValidationError("");

    if (!member || !user) {
      setValidationError(
        "Le membre ou la session utilisateur est introuvable."
      );
      return;
    }

    const cleanActivity = activity.trim();
    const cleanDate = date.trim();
    const cleanStartTime =
      startTime.trim();
    const cleanEndTime =
      endTime.trim();
    const cleanMessage =
      message.trim();

    if (
      cleanActivity === "" ||
      cleanDate === "" ||
      cleanStartTime === "" ||
      cleanEndTime === ""
    ) {
      setValidationError(
        "Veuillez remplir tous les champs obligatoires."
      );
      return;
    }

    const parsedDate =
      parseFrenchDate(cleanDate);

    if (!parsedDate) {
      setValidationError(
        "Date invalide : saisissez une date réelle au format JJ/MM/AAAA."
      );
      return;
    }

    const startMinutes =
      timeToMinutes(cleanStartTime);

    if (startMinutes === null) {
      setValidationError(
        "Heure de début invalide : utilisez le format HH:MM, par exemple 18:00."
      );
      return;
    }

    const endMinutes =
      timeToMinutes(cleanEndTime);

    if (endMinutes === null) {
      setValidationError(
        "Heure de fin invalide : utilisez le format HH:MM, par exemple 19:00."
      );
      return;
    }

    if (endMinutes <= startMinutes) {
      setValidationError(
        "L’heure de fin doit être postérieure à l’heure de début."
      );
      return;
    }

    const sessionStart = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      Math.floor(startMinutes / 60),
      startMinutes % 60
    );

    if (
      sessionStart.getTime() <= Date.now()
    ) {
      setValidationError(
        "La séance doit être programmée à une date et une heure futures."
      );
      return;
    }

    const duplicateRequest =
      requests.some(
        (request) =>
          request.senderId === user.uid &&
          request.receiverId === member.id &&
          request.date === cleanDate &&
          request.startTime ===
            cleanStartTime &&
          request.endTime ===
            cleanEndTime &&
          request.status !== "rejected"
      );

    if (duplicateRequest) {
      setValidationError(
        "Une demande existe déjà pour ce membre, cette date et cet horaire."
      );
      return;
    }

    try {
      setSending(true);

      await addRequest({
        receiverId: member.id,
        receiverName: member.name,
        activity: cleanActivity,
        date: cleanDate,
        startTime: cleanStartTime,
        endTime: cleanEndTime,
        message: cleanMessage,
      });

      Alert.alert(
        "Demande envoyée",
        `Votre proposition a été envoyée à ${member.name}.`,
        [
          {
            text: "Voir mes demandes",
            onPress: () =>
              router.replace(
                "/(tabs)/demandes"
              ),
          },
        ]
      );

      if (Platform.OS === "web") {
        router.replace(
          "/(tabs)/demandes"
        );
      }
    } catch (sendError) {
      console.error(sendError);

      setValidationError(
        "La demande n’a pas pu être envoyée. Veuillez réessayer."
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Chargement du membre...
        </Text>
      </View>
    );
  }

  if (error !== "" || !member) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="person-remove-outline"
          size={58}
          color={colors.danger}
        />

        <Text style={styles.errorTitle}>
          Membre introuvable
        </Text>

        <Text style={styles.errorText}>
          {error ||
            "Ce membre n’est plus disponible."}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text
            style={styles.backButtonText}
          >
            Retour
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.memberCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {member.name
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={styles.memberInformation}
          >
            <Text style={styles.memberLabel}>
              Proposition destinée à
            </Text>

            <Text style={styles.memberName}>
              {member.name}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>
          Proposer une séance
        </Text>

        <Text style={styles.subtitle}>
          Choisissez une date et un horaire
          adaptés à votre partenaire.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>
            Activité *
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="barbell-outline"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              style={styles.input}
              value={activity}
              onChangeText={(value) => {
                setActivity(value);
                clearValidationError();
              }}
              placeholder="Exemple : Musculation"
              placeholderTextColor={
                colors.placeholder
              }
              editable={!sending}
            />
          </View>

          <Text style={styles.label}>
            Date *
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              style={styles.input}
              value={date}
              onChangeText={(value) => {
                setDate(value);
                clearValidationError();
              }}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor={
                colors.placeholder
              }
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              editable={!sending}
            />
          </View>

          <Text style={styles.helpText}>
            Exemple : 15/12/2027
          </Text>

          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <Text style={styles.label}>
                Début *
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.input}
                  value={startTime}
                  onChangeText={(value) => {
                    setStartTime(value);
                    clearValidationError();
                  }}
                  placeholder="18:00"
                  placeholderTextColor={
                    colors.placeholder
                  }
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={!sending}
                />
              </View>
            </View>

            <View
              style={styles.timeSeparator}
            >
              <Ionicons
                name="arrow-forward"
                size={20}
                color={colors.textMuted}
              />
            </View>

            <View style={styles.timeField}>
              <Text style={styles.label}>
                Fin *
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.textMuted}
                />

                <TextInput
                  style={styles.input}
                  value={endTime}
                  onChangeText={(value) => {
                    setEndTime(value);
                    clearValidationError();
                  }}
                  placeholder="19:00"
                  placeholderTextColor={
                    colors.placeholder
                  }
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  editable={!sending}
                />
              </View>
            </View>
          </View>

          <Text style={styles.label}>
            Message facultatif
          </Text>

          <View
            style={[
              styles.inputContainer,
              styles.messageContainer,
            ]}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              style={[
                styles.input,
                styles.messageInput,
              ]}
              value={message}
              onChangeText={setMessage}
              placeholder="Ajouter un message..."
              placeholderTextColor={
                colors.placeholder
              }
              multiline
              maxLength={500}
              textAlignVertical="top"
              editable={!sending}
            />
          </View>

          <Text
            style={styles.characterCount}
          >
            {message.length}/500
          </Text>

          {validationError !== "" && (
            <View
              style={styles.validationError}
            >
              <Ionicons
                name="alert-circle-outline"
                size={21}
                color={colors.danger}
              />

              <Text
                style={
                  styles.validationErrorText
                }
              >
                {validationError}
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              sending &&
                styles.disabledButton,
              pressed &&
                !sending &&
                styles.pressedButton,
            ]}
            onPress={sendRequest}
            disabled={sending}
          >
            {sending ? (
              <>
                <ActivityIndicator
                  color={colors.white}
                />

                <Text
                  style={styles.buttonText}
                >
                  Envoi en cours...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="send-outline"
                  size={21}
                  color={colors.white}
                />

                <Text
                  style={styles.buttonText}
                >
                  Envoyer la demande
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingBottom: 45,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },

  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  avatar: {
    width: 55,
    height: 55,
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

  memberInformation: {
    flex: 1,
    marginLeft: spacing.md,
  },

  memberLabel: {
    color: "#D7E4F2",
    fontSize: 13,
  },

  memberName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 3,
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
    marginTop: spacing.xl,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },

  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
  },

  helpText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -spacing.md,
    marginBottom: spacing.lg,
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  timeField: {
    flex: 1,
  },

  timeSeparator: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },

  messageContainer: {
    alignItems: "flex-start",
    paddingTop: spacing.md,
    marginBottom: spacing.xs,
  },

  messageInput: {
    minHeight: 90,
    paddingTop: 0,
  },

  characterCount: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "right",
  },

  validationError: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },

  validationErrorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },

  button: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    marginTop: spacing.xl,
  },

  disabledButton: {
    opacity: 0.6,
  },

  pressedButton: {
    opacity: 0.8,
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
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
    lineHeight: 23,
    marginTop: spacing.sm,
  },
});