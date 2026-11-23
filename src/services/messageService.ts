import {
    addDoc,
    collection,
    DocumentData,
    onSnapshot,
    query,
    QuerySnapshot,
    serverTimestamp,
    where,
} from "firebase/firestore";

import { db } from "./firebase";

export type ChatMessage = {
  id: string;
  conversationId: string;
  requestId: string;
  senderId: string;
  receiverId: string;
  participantIds: string[];
  text: string;
  createdAt: number;
};

export function createConversationId(
  firstUserId: string,
  secondUserId: string
) {
  return [firstUserId, secondUserId]
    .sort()
    .join("_");
}

export async function sendChatMessage({
  requestId,
  senderId,
  receiverId,
  text,
}: {
  requestId: string;
  senderId: string;
  receiverId: string;
  text: string;
}) {
  const conversationId = createConversationId(
    senderId,
    receiverId
  );

  await addDoc(collection(db, "messages"), {
    conversationId,
    requestId,
    senderId,
    receiverId,
    participantIds: [
      senderId,
      receiverId,
    ],
    text,
    createdAt: serverTimestamp(),
  });
}

function convertMessages(
  snapshot: QuerySnapshot<DocumentData>
): ChatMessage[] {
  return snapshot.docs
    .map((messageDocument) => {
      const data = messageDocument.data();

      return {
        id: messageDocument.id,
        conversationId: data.conversationId,
        requestId: data.requestId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        participantIds:
          data.participantIds ?? [],
        text: data.text ?? "",
        createdAt:
          data.createdAt?.toMillis?.() ?? 0,
      };
    })
    .sort(
      (firstMessage, secondMessage) =>
        firstMessage.createdAt -
        secondMessage.createdAt
    );
}

export function subscribeToMessages(
  firstUserId: string,
  secondUserId: string,
  callback: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void
) {
  const conversationId = createConversationId(
    firstUserId,
    secondUserId
  );

  const messagesQuery = query(
    collection(db, "messages"),
    where(
      "participantIds",
      "array-contains",
      firstUserId
    )
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const conversationMessages =
        convertMessages(snapshot).filter(
          (message) =>
            message.conversationId ===
            conversationId
        );

      callback(conversationMessages);
    },
    onError
  );
}