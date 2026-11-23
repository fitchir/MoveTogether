import {
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

export type ProfileData = {
  firstname: string;
  email: string;
  activity: string;
  level: string;
  goal: string;
  availability: string;
  gym: string;
};

export async function saveUserProfile(
  userId: string,
  profile: ProfileData
) {
  const profileReference = doc(db, "users", userId);
  const existingProfile = await getDoc(profileReference);

  await setDoc(
    profileReference,
    {
      ...profile,

      updatedAt: serverTimestamp(),

      ...(existingProfile.exists()
        ? {}
        : {
            createdAt: serverTimestamp(),
          }),
    },
    {
      merge: true,
    }
  );
}

export async function getUserProfile(
  userId: string
): Promise<ProfileData | null> {
  const profileReference = doc(db, "users", userId);
  const profileSnapshot = await getDoc(profileReference);

  if (!profileSnapshot.exists()) {
    return null;
  }

  return profileSnapshot.data() as ProfileData;
}