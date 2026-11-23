import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useRequests } from "../../contexts/RequestsContext";
import {
  ChatMessage,
  sendChatMessage,
  subscribeToMessages,
} from "../../services/messageService";
import {
  colors,
  radius,
  shadows,
  spacing,
} from "../../theme";

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{
    id: string | string[];
  }>();

  const { user } = useAuth();
  const { requests, loading: requestsLoading } =
    useRequests();

  const listReference =
    useRef<FlatList<ChatMessage>>(null);

  const partnerId = Array.isArray(id)
    ? id[0]
    : id;

  const acceptedRequest = requests.find(
    (request) =>
      request.status === "accepted" &&
      (
        (
          request.senderId === user?.uid &&
          request.receiverId === partnerId
        ) ||
        (
          request.receiverId === user?.uid &&
          request.senderId === partnerId
        )
      )
  );

  const isRequestSender =
    acceptedRequest?.senderId === user?.uid;

  const partnerName = acceptedRequest
    ? isRequestSender
      ? acceptedRequest.receiverName
      : acceptedRequest.senderName
    : "";

  const [messages, setMessages] = useState<
    ChatMessage[]
  >([]);

  const [text, setText] = useState("");
  const [loadingMessages, setLoadingMessages] =
    useState(true);
  const [sending, setSending] = useState(false);
  const [messageError, setMessageError] =
    useState("");

  useEffect(() => {
    if (
      requestsLoading ||
      !user ||
      !partnerId ||
      !acceptedRequest
    ) {
      if (!requestsLoading) {
        setLoadingMessages(false);
      }

      return;
    }

    setLoadingMessages(true);
    setMessageError("");

    const unsubscribe = subscribeToMessages(
      user.uid,
      partnerId,
      (newMessages) => {
        setMessages(newMessages);
        setLoadingMessages(false);
      },
      (subscriptionError) => {
        console.error(subscriptionError);

        setMessageError(
          "Impossible de charger les messages."
        );

        setLoadingMessages(false);
      }
    );

    return unsubscribe;
  }, [
    user,
    partnerId,
    acceptedRequest?.id,
    requestsLoading,
  ]);

  const handleSendMessage = async () => {
    const cleanedText = text.trim();

    if (
      cleanedText === "" ||
      !user ||
      !partnerId ||
      !acceptedRequest ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);

      await sendChatMessage({
        requestId: acceptedRequest.id,
        senderId: user.uid,
        receiverId: partnerId,
        text: cleanedText,
      });

      setText("");
    } catch (sendError) {
      console.error(sendError);

      Alert.alert(
        "Erreur",
        "Le message n’a pas pu être envoyé."
      );
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) {
      return "À l’instant";
    }

    return new Date(timestamp).toLocaleTimeString(
      "fr-FR",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  if (requestsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Ouverture de la conversation...
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="lock-closed-outline"
          size={58}
          color={colors.primary}
        />

        <Text style={styles.errorTitle}>
          Connexion nécessaire
        </Text>

        <Text style={styles.errorText}>
          Vous devez être connecté pour accéder à cette
          conversation.
        </Text>
      </View>
    );
  }

  if (!acceptedRequest) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={58}
          color={colors.textMuted}
        />

        <Text style={styles.errorTitle}>
          Conversation inaccessible
        </Text>

        <Text style={styles.errorText}>
          Une demande doit être acceptée avant de pouvoir
          échanger des messages.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios" ? "padding" : undefined
      }
      keyboardVerticalOffset={
        Platform.OS === "ios" ? 90 : 0
      }
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {partnerName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.headerInformation}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {partnerName}
          </Text>

          <View style={styles.activityRow}>
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={colors.success}
            />

            <Text style={styles.activity}>
              Séance de {acceptedRequest.activity}
            </Text>
          </View>
        </View>
      </View>

      {loadingMessages ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.secondary}
          />

          <Text style={styles.loadingText}>
            Chargement des messages...
          </Text>
        </View>
      ) : messageError !== "" ? (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={52}
            color={colors.danger}
          />

          <Text style={styles.errorText}>
            {messageError}
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listReference}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            listReference.current?.scrollToEnd({
              animated: true,
            })
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={42}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                Commencez la conversation
              </Text>

              <Text style={styles.emptyDescription}>
                Envoyez un premier message à{" "}
                {partnerName}.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMyMessage =
              item.senderId === user.uid;

            return (
              <View
                style={[
                  styles.messageGroup,
                  isMyMessage
                    ? styles.myMessageGroup
                    : styles.partnerMessageGroup,
                ]}
              >
                {!isMyMessage && (
                  <Text style={styles.senderName}>
                    {partnerName}
                  </Text>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isMyMessage
                      ? styles.myMessage
                      : styles.partnerMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      !isMyMessage &&
                        styles.partnerMessageText,
                    ]}
                  >
                    {item.text}
                  </Text>

                  <Text
                    style={[
                      styles.messageTime,
                      !isMyMessage &&
                        styles.partnerMessageTime,
                    ]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Écrire un message..."
          placeholderTextColor={colors.placeholder}
          multiline
          maxLength={500}
          returnKeyType="default"
        />

        <Pressable
          style={({ pressed }) => [
            styles.sendButton,
            (text.trim() === "" || sending) &&
              styles.disabledButton,
            pressed &&
              text.trim() !== "" &&
              styles.pressedButton,
          ]}
          onPress={handleSendMessage}
          disabled={
            text.trim() === "" || sending
          }
          accessibilityRole="button"
          accessibilityLabel="Envoyer le message"
        >
          {sending ? (
            <ActivityIndicator
              size="small"
              color={colors.white}
            />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={colors.white}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    ...shadows.card,
  },

  avatar: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 26,
    marginRight: spacing.md,
  },

  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "bold",
  },

  headerInformation: {
    flex: 1,
  },

  name: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "bold",
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },

  activity: {
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: spacing.xs,
  },

  messages: {
    flexGrow: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },

  messageGroup: {
    maxWidth: "82%",
    marginTop: spacing.md,
  },

  myMessageGroup: {
    alignSelf: "flex-end",
  },

  partnerMessageGroup: {
    alignSelf: "flex-start",
  },

  senderName: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
    marginLeft: spacing.sm,
  },

  messageBubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  myMessage: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },

  partnerMessage: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    ...shadows.card,
  },

  messageText: {
    color: colors.white,
    fontSize: 16,
    lineHeight: 22,
  },

  partnerMessageText: {
    color: colors.text,
  },

  messageTime: {
    alignSelf: "flex-end",
    color: "#D7E4F2",
    fontSize: 10,
    marginTop: spacing.xs,
  },

  partnerMessageTime: {
    color: colors.textMuted,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 15,
  },

  sendButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 22,
    marginLeft: spacing.sm,
  },

  disabledButton: {
    opacity: 0.45,
  },

  pressedButton: {
    opacity: 0.8,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },

  emptyIcon: {
    width: 82,
    height: 82,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 41,
    ...shadows.card,
  },

  emptyTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: spacing.lg,
  },

  emptyDescription: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    marginTop: spacing.sm,
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
    fontSize: 16,
    textAlign: "center",
    lineHeight: 23,
    marginTop: spacing.sm,
  },
});