import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getApp,
  getApps,
  initializeApp,
} from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import {
  getFirestore,
} from "firebase/firestore";
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey:
    "AIzaSyCpL-LvIDdBGDxjGUmz87Zk0CeBahS5DPI",

  authDomain:
    "movetogether-2d335.firebaseapp.com",

  projectId:
    "movetogether-2d335",

  storageBucket:
    "movetogether-2d335.firebasestorage.app",

  messagingSenderId:
    "3335694737",

  appId:
    "1:3335694737:web:e634a143277f56f014d230",
};

const app =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApp();

type ReactNativeStorage = {
  setItem: (
    key: string,
    value: string
  ) => Promise<void>;

  getItem: (
    key: string
  ) => Promise<string | null>;

  removeItem: (
    key: string
  ) => Promise<void>;
};

type FirebaseAuthWithNativePersistence =
  typeof FirebaseAuth & {
    getReactNativePersistence: (
      storage: ReactNativeStorage
    ) => FirebaseAuth.Persistence;
  };

function createAuth(): FirebaseAuth.Auth {
  /*
   * Sur le Web, Firebase utilise la persistance
   * du navigateur.
   */
  if (Platform.OS === "web") {
    return FirebaseAuth.getAuth(app);
  }

  /*
   * Cette conversion corrige uniquement le type
   * TypeScript manquant dans certaines versions
   * de Firebase.
   */
  const nativeFirebaseAuth =
    FirebaseAuth as FirebaseAuthWithNativePersistence;

  try {
    return FirebaseAuth.initializeAuth(app, {
      persistence:
        nativeFirebaseAuth
          .getReactNativePersistence(
            AsyncStorage
          ),
    });
  } catch {
    /*
     * Pendant le rechargement rapide d’Expo,
     * l’authentification peut être déjà initialisée.
     */
    return FirebaseAuth.getAuth(app);
  }
}

export const auth = createAuth();

export const db = getFirestore(app);

export default app;