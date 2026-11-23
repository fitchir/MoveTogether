export type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected";

export type TrainingRequest = {
  id: string;

  senderId: string;
  senderName: string;

  receiverId: string;
  receiverName: string;

  activity: string;
  date: string;
  startTime: string;
  endTime: string;
  message: string;

  status: RequestStatus;
};