import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

const STORAGE_KEY_PREFIX =
  "session-reminder:";

export type SessionReminder = {
  sessionId: string;
  notificationId: string;
  activity: string;
  partnerName: string;
  sessionDate: string;
  sessionTime: string;
  reminderDate: string;
  minutesBefore: number;
};

type ScheduleReminderOptions = {
  sessionId: string;
  activity: string;
  partnerName: string;
  sessionDate: string;
  sessionTime: string;
  minutesBefore: number;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getStorageKey(sessionId: string) {
  return `${STORAGE_KEY_PREFIX}${sessionId}`;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const currentPermissions =
    await Notifications.getPermissionsAsync();

  if (
    currentPermissions.status ===
    Notifications.PermissionStatus.GRANTED
  ) {
    return true;
  }

  const requestedPermissions =
    await Notifications.requestPermissionsAsync();

  return (
    requestedPermissions.status ===
    Notifications.PermissionStatus.GRANTED
  );
}

function createSessionDate(
  dateValue: string,
  timeValue: string
): Date {
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
    throw new Error(
      "La date ou l’heure de la séance est invalide."
    );
  }

  const [day, month, year] = dateParts;
  const [hours, minutes] = timeParts;

  const sessionDate = new Date(
    year,
    month - 1,
    day,
    hours,
    minutes,
    0,
    0
  );

  const dateIsValid =
    sessionDate.getFullYear() === year &&
    sessionDate.getMonth() === month - 1 &&
    sessionDate.getDate() === day &&
    sessionDate.getHours() === hours &&
    sessionDate.getMinutes() === minutes;

  if (!dateIsValid) {
    throw new Error(
      "La date ou l’heure de la séance est invalide."
    );
  }

  return sessionDate;
}

export function calculateReminderDate(
  sessionDate: string,
  sessionTime: string,
  minutesBefore: number
): Date {
  const date = createSessionDate(
    sessionDate,
    sessionTime
  );

  const reminderDate = new Date(
    date.getTime() -
      minutesBefore * 60 * 1000
  );

  if (reminderDate.getTime() <= Date.now()) {
    throw new Error(
      "L’heure choisie pour le rappel est déjà passée."
    );
  }

  return reminderDate;
}

export async function getSessionReminder(
  sessionId: string
): Promise<SessionReminder | null> {
  const storedReminder =
    await AsyncStorage.getItem(
      getStorageKey(sessionId)
    );

  if (!storedReminder) {
    return null;
  }

  try {
    return JSON.parse(
      storedReminder
    ) as SessionReminder;
  } catch {
    await AsyncStorage.removeItem(
      getStorageKey(sessionId)
    );

    return null;
  }
}

export async function cancelSessionReminder(
  sessionId: string
): Promise<void> {
  const existingReminder =
    await getSessionReminder(sessionId);

  if (existingReminder) {
    try {
      await Notifications
        .cancelScheduledNotificationAsync(
          existingReminder.notificationId
        );
    } catch (error) {
      console.warn(
        "Le rappel système n’a pas pu être annulé :",
        error
      );
    }
  }

  await AsyncStorage.removeItem(
    getStorageKey(sessionId)
  );
}

export async function scheduleSessionReminder({
  sessionId,
  activity,
  partnerName,
  sessionDate,
  sessionTime,
  minutesBefore,
}: ScheduleReminderOptions): Promise<SessionReminder> {
  const permissionGranted =
    await requestNotificationPermission();

  if (!permissionGranted) {
    throw new Error(
      "L’autorisation des notifications a été refusée."
    );
  }

  if (minutesBefore <= 0) {
    throw new Error(
      "Le délai du rappel doit être supérieur à zéro."
    );
  }

  const reminderDate =
    calculateReminderDate(
      sessionDate,
      sessionTime,
      minutesBefore
    );

  await cancelSessionReminder(sessionId);

  const notificationId =
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Séance bientôt prévue 🏋️",
        body:
          `Votre séance de ${activity} avec ` +
          `${partnerName} commence à ${sessionTime}.`,
        sound: "default",
        data: {
          sessionId,
          type: "session-reminder",
        },
      },

      /*
       * Aucun channelId n’est indiqué.
       * Expo Go utilisera son canal Android par défaut.
       */
      trigger: {
        type:
          Notifications
            .SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

  const reminder: SessionReminder = {
    sessionId,
    notificationId,
    activity,
    partnerName,
    sessionDate,
    sessionTime,
    reminderDate:
      reminderDate.toISOString(),
    minutesBefore,
  };

  await AsyncStorage.setItem(
    getStorageKey(sessionId),
    JSON.stringify(reminder)
  );

  return reminder;
}

export async function updateSessionReminder(
  options: ScheduleReminderOptions
): Promise<SessionReminder> {
  return scheduleSessionReminder(options);
}

export async function getAllSessionReminders(): Promise<
  SessionReminder[]
> {
  const keys = await AsyncStorage.getAllKeys();

  const reminderKeys = keys.filter((key) =>
    key.startsWith(STORAGE_KEY_PREFIX)
  );

  if (reminderKeys.length === 0) {
    return [];
  }

  const storedValues =
    await AsyncStorage.multiGet(
      reminderKeys
    );

  return storedValues.flatMap(
    ([, storedValue]) => {
      if (!storedValue) {
        return [];
      }

      try {
        return [
          JSON.parse(
            storedValue
          ) as SessionReminder,
        ];
      } catch {
        return [];
      }
    }
  );
}