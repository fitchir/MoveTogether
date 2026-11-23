import {
    addDoc,
    collection,
    doc,
    DocumentData,
    onSnapshot,
    query,
    QuerySnapshot,
    serverTimestamp,
    updateDoc,
    where,
} from "firebase/firestore";

import {
    RequestStatus,
    TrainingRequest,
} from "../types/trainingRequest";
import { db } from "./firebase";

type RequestWithoutId = Omit<
  TrainingRequest,
  "id"
>;

export async function createTrainingRequest(
  request: RequestWithoutId
) {
  await addDoc(collection(db, "requests"), {
    ...request,
    createdAt: serverTimestamp(),
  });
}

export async function changeRequestStatus(
  requestId: string,
  status: RequestStatus
) {
  await updateDoc(doc(db, "requests", requestId), {
    status,
  });
}

function convertSnapshot(
  snapshot: QuerySnapshot<DocumentData>
): TrainingRequest[] {
  return snapshot.docs.map((requestDocument) => {
    const data = requestDocument.data();

    return {
      id: requestDocument.id,
      senderId: data.senderId,
      senderName: data.senderName,
      receiverId: data.receiverId,
      receiverName: data.receiverName,
      activity: data.activity,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      message: data.message ?? "",
      status: data.status,
    };
  });
}

export function subscribeToSentRequests(
  userId: string,
  callback: (requests: TrainingRequest[]) => void,
  onError: (error: Error) => void
) {
  const requestQuery = query(
    collection(db, "requests"),
    where("senderId", "==", userId)
  );

  return onSnapshot(
    requestQuery,
    (snapshot) => callback(convertSnapshot(snapshot)),
    onError
  );
}

export function subscribeToReceivedRequests(
  userId: string,
  callback: (requests: TrainingRequest[]) => void,
  onError: (error: Error) => void
) {
  const requestQuery = query(
    collection(db, "requests"),
    where("receiverId", "==", userId)
  );

  return onSnapshot(
    requestQuery,
    (snapshot) => callback(convertSnapshot(snapshot)),
    onError
  );
}