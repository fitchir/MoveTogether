import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { doc, updateDoc } from "firebase/firestore";

import { db } from "./firebase";
import { supabase } from "./supabase";

type UploadAvatarOptions = {
  uri: string;
  userId: string;
  mimeType?: string | null;
};

function getImageInformation(
  mimeType?: string | null
) {
  switch (mimeType) {
    case "image/png":
      return {
        extension: "png",
        contentType: "image/png",
      };

    case "image/webp":
      return {
        extension: "webp",
        contentType: "image/webp",
      };

    case "image/jpeg":
    case "image/jpg":
    default:
      return {
        extension: "jpg",
        contentType: "image/jpeg",
      };
  }
}

export async function uploadProfileAvatar({
  uri,
  userId,
  mimeType,
}: UploadAvatarOptions): Promise<string> {
  if (!uri) {
    throw new Error("Aucune photo sélectionnée.");
  }

  if (!userId) {
    throw new Error("Utilisateur non connecté.");
  }

  const { extension, contentType } =
    getImageInformation(mimeType);

  const base64 = await FileSystem.readAsStringAsync(
    uri,
    {
      encoding: FileSystem.EncodingType.Base64,
    }
  );

  const filePath =
    `${userId}/${Date.now()}.${extension}`;

  const { error: uploadError } =
    await supabase.storage
      .from("avatars")
      .upload(filePath, decode(base64), {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data } = supabase.storage
    .from("avatars")
    .getPublicUrl(filePath);

  const photoUrl = data.publicUrl;

  if (!photoUrl) {
    throw new Error(
      "Impossible de récupérer l’adresse de la photo."
    );
  }

  await updateDoc(doc(db, "users", userId), {
    photoUrl,
    photoPath: filePath,
  });

  return photoUrl;
}