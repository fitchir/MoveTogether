import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  changeRequestStatus,
  createTrainingRequest,
  subscribeToReceivedRequests,
  subscribeToSentRequests,
} from "../services/requestService";
import {
  RequestStatus,
  TrainingRequest,
} from "../types/trainingRequest";
import { useAuth } from "./AuthContext";

type NewTrainingRequest = Omit<
  TrainingRequest,
  | "id"
  | "status"
  | "senderId"
  | "senderName"
>;

type RequestsContextValue = {
  requests: TrainingRequest[];
  loading: boolean;
  error: string;
  addRequest: (
    request: NewTrainingRequest
  ) => Promise<void>;
  updateRequestStatus: (
    requestId: string,
    status: RequestStatus
  ) => Promise<void>;
};

type RequestsProviderProps = {
  children: ReactNode;
};

const RequestsContext =
  createContext<RequestsContextValue | undefined>(
    undefined
  );

export function RequestsProvider({
  children,
}: RequestsProviderProps) {
  const { user } = useAuth();

  const [sentRequests, setSentRequests] = useState<
    TrainingRequest[]
  >([]);

  const [receivedRequests, setReceivedRequests] =
    useState<TrainingRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setSentRequests([]);
      setReceivedRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    let sentLoaded = false;
    let receivedLoaded = false;

    const finishLoading = () => {
      if (sentLoaded && receivedLoaded) {
        setLoading(false);
      }
    };

    const handleError = (subscriptionError: Error) => {
      console.error(subscriptionError);
      setError(
        "Impossible de charger les demandes."
      );
      setLoading(false);
    };

    const unsubscribeSent =
      subscribeToSentRequests(
        user.uid,
        (newRequests) => {
          setSentRequests(newRequests);
          sentLoaded = true;
          finishLoading();
        },
        handleError
      );

    const unsubscribeReceived =
      subscribeToReceivedRequests(
        user.uid,
        (newRequests) => {
          setReceivedRequests(newRequests);
          receivedLoaded = true;
          finishLoading();
        },
        handleError
      );

    return () => {
      unsubscribeSent();
      unsubscribeReceived();
    };
  }, [user]);

  const requests = useMemo(() => {
    const uniqueRequests = new Map<
      string,
      TrainingRequest
    >();

    [...sentRequests, ...receivedRequests].forEach(
      (request) => {
        uniqueRequests.set(request.id, request);
      }
    );

    return Array.from(uniqueRequests.values());
  }, [sentRequests, receivedRequests]);

  const addRequest = async (
    request: NewTrainingRequest
  ) => {
    if (!user) {
      throw new Error(
        "Vous devez être connecté."
      );
    }

    await createTrainingRequest({
      ...request,
      senderId: user.uid,
      senderName:
        user.displayName ??
        user.email ??
        "Utilisateur",
      status: "pending",
    });
  };

  const updateRequestStatus = async (
    requestId: string,
    status: RequestStatus
  ) => {
    await changeRequestStatus(
      requestId,
      status
    );
  };

  return (
    <RequestsContext.Provider
      value={{
        requests,
        loading,
        error,
        addRequest,
        updateRequestStatus,
      }}
    >
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestsContext);

  if (!context) {
    throw new Error(
      "useRequests doit être utilisé dans RequestsProvider"
    );
  }

  return context;
}