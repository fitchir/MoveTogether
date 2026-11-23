import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCpL-LvIDdBGDxjGUmz87Zk0CeBahS5DPI",
  authDomain: "movetogether-2d335.firebaseapp.com",
  projectId: "movetogether-2d335",
  storageBucket: "movetogether-2d335.firebasestorage.app",
  messagingSenderId: "3335694737",
  appId: "1:3335694737:web:e634a143277f56f014d230",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;