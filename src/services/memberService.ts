import {
    collection,
    doc,
    getDoc,
    getDocs,
} from "firebase/firestore";

import { Member } from "../types/member";
import { db } from "./firebase";

function convertToMember(
  id: string,
  data: Record<string, any>
): Member {
  return {
    id,
    name: data.firstname ?? "Utilisateur",
    activity: data.activity ?? "Non renseignée",
    level: data.level ?? "Non renseigné",
    availability: data.availability ?? "Non renseignée",
    gym: data.gym ?? "Non renseignée",
    goal: data.goal ?? "Non renseigné",
  };
}

export async function getMembers(
  currentUserId: string
): Promise<Member[]> {
  const snapshot = await getDocs(
    collection(db, "users")
  );

  return snapshot.docs
    // Supprime temporairement cette ligne pour voir ton profil.
    .filter((document) => document.id !== currentUserId)
    .map((document) =>
      convertToMember(document.id, document.data())
    );
}

export async function getMemberById(
  memberId: string
): Promise<Member | null> {
  const memberReference = doc(db, "users", memberId);
  const memberSnapshot = await getDoc(memberReference);

  if (!memberSnapshot.exists()) {
    return null;
  }

  return convertToMember(
    memberSnapshot.id,
    memberSnapshot.data()
  );
}