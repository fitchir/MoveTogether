import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { doc, getDoc } from "firebase/firestore";
import {
    useEffect,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { uploadProfileAvatar } from "../services/avatarService";
import { db } from "../services/firebase";

type ProfilePhotoPickerProps = {
  firstname: string;
};

export default function ProfilePhotoPicker({
  firstname,
}: ProfilePhotoPickerProps) {
  const { user } = useAuth();

  const [confirmedPhoto, setConfirmedPhoto] =
    useState<string | null>(null);

  const [temporaryPhoto, setTemporaryPhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(
      null
    );

  const [loadingPhoto, setLoadingPhoto] =
    useState(true);

  const [choosing, setChoosing] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [information, setInformation] =
    useState("");

  useEffect(() => {
    async function loadCurrentPhoto() {
      if (!user) {
        setLoadingPhoto(false);
        return;
      }

      try {
        setLoadingPhoto(true);

        const profileSnapshot = await getDoc(
          doc(db, "users", user.uid)
        );

        if (profileSnapshot.exists()) {
          const profileData =
            profileSnapshot.data();

          const photoUrl =
            typeof profileData.photoUrl === "string"
              ? profileData.photoUrl
              : null;

          setConfirmedPhoto(photoUrl);
        }
      } catch (error) {
        console.error(
          "Erreur pendant le chargement de la photo :",
          error
        );

        setInformation(
          "La photo enregistrée n’a pas pu être chargée."
        );
      } finally {
        setLoadingPhoto(false);
      }
    }

    loadCurrentPhoto();
  }, [user]);

  const chooseImage = async (
    source: "camera" | "gallery"
  ) => {
    if (uploading) {
      return;
    }

    try {
      setChoosing(true);
      setInformation("");

      if (source === "camera") {
        const permission =
          await ImagePicker
            .requestCameraPermissionsAsync();

        if (!permission.granted) {
          setInformation(
            "L’accès à la caméra a été refusé. Vous pouvez choisir une photo dans la galerie."
          );
          return;
        }
      } else {
        const permission =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
          setInformation(
            "L’accès à la galerie a été refusé."
          );
          return;
        }
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      };

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync(
              options
            )
          : await ImagePicker
              .launchImageLibraryAsync(options);

      if (result.canceled) {
        setInformation(
          "Aucune nouvelle photo n’a été sélectionnée."
        );
        return;
      }

      const selectedPhoto = result.assets[0];

if (!selectedPhoto) {
  setInformation(
    "La photo sélectionnée est introuvable."
  );
  return;
}

setInformation(
  "Préparation et compression de la photo..."
);

const compressedPhoto =
  await ImageManipulator.manipulateAsync(
    selectedPhoto.uri,
    [
      {
        resize: {
          width: 900,
        },
      },
    ],
    {
      compress: 0.65,
      format:
        ImageManipulator.SaveFormat.JPEG,
    }
  );

setTemporaryPhoto({
  ...selectedPhoto,
  uri: compressedPhoto.uri,
  width: compressedPhoto.width,
  height: compressedPhoto.height,
  mimeType: "image/jpeg",
});

     

      setInformation(
        "Vérifiez l’aperçu avant de confirmer."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Erreur",
        "Impossible d’ouvrir la caméra ou la galerie."
      );
    } finally {
      setChoosing(false);
    }
  };

  const confirmPhoto = async () => {
    if (!temporaryPhoto) {
      return;
    }

    if (!user) {
      Alert.alert(
        "Connexion requise",
        "Vous devez être connecté pour enregistrer une photo."
      );
      return;
    }

    try {
      setUploading(true);
      setInformation(
        "Envoi de la photo en cours..."
      );

      const photoUrl =
        await uploadProfileAvatar({
          uri: temporaryPhoto.uri,
          userId: user.uid,
          mimeType: temporaryPhoto.mimeType,
        });

      setConfirmedPhoto(photoUrl);
      setTemporaryPhoto(null);

      setInformation(
        "La photo de profil a été enregistrée."
      );

      Alert.alert(
        "Photo enregistrée",
        "Votre photo de profil a été envoyée avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur pendant l’envoi de la photo :",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue.";

      setInformation(
        "La photo n’a pas pu être enregistrée."
      );

      Alert.alert(
        "Envoi impossible",
        message
      );
    } finally {
      setUploading(false);
    }
  };

  const cancelPhoto = () => {
    if (uploading) {
      return;
    }

    setTemporaryPhoto(null);

    setInformation(
      "La nouvelle photo a été annulée."
    );
  };

  const displayedPhoto =
    temporaryPhoto?.uri ?? confirmedPhoto;

  const interactionDisabled =
    choosing || uploading;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Photo de profil
      </Text>

      <View style={styles.avatarContainer}>
        {loadingPhoto ? (
          <View style={styles.defaultAvatar}>
            <ActivityIndicator
              size="large"
              color="#FFFFFF"
            />
          </View>
        ) : displayedPhoto ? (
          <Image
            source={{ uri: displayedPhoto }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <Text style={styles.avatarText}>
              {firstname
                ? firstname
                    .charAt(0)
                    .toUpperCase()
                : "M"}
            </Text>
          </View>
        )}

        {temporaryPhoto && (
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>
              Aperçu
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={[
            styles.cameraButton,
            interactionDisabled &&
              styles.disabledButton,
          ]}
          onPress={() =>
            chooseImage("camera")
          }
          disabled={interactionDisabled}
        >
          <Ionicons
            name="camera-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text style={styles.buttonText}>
            Prendre une photo
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.galleryButton,
            interactionDisabled &&
              styles.disabledButton,
          ]}
          onPress={() =>
            chooseImage("gallery")
          }
          disabled={interactionDisabled}
        >
          <Ionicons
            name="images-outline"
            size={21}
            color="#12355B"
          />

          <Text style={styles.galleryButtonText}>
            Galerie
          </Text>
        </Pressable>
      </View>

      {(choosing || uploading) && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            color="#22C55E"
          />

          <Text style={styles.loadingText}>
            {uploading
              ? "Enregistrement de la photo..."
              : "Ouverture en cours..."}
          </Text>
        </View>
      )}

      {information !== "" && (
        <Text style={styles.information}>
          {information}
        </Text>
      )}

      {temporaryPhoto && (
        <View style={styles.confirmationButtons}>
          <Pressable
            style={[
              styles.confirmButton,
              uploading &&
                styles.disabledButton,
            ]}
            onPress={confirmPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.confirmButtonText
                  }
                >
                  Confirmer
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.cancelButton,
              uploading &&
                styles.disabledButton,
            ]}
            onPress={cancelPhoto}
            disabled={uploading}
          >
            <Ionicons
              name="close-outline"
              size={20}
              color="#DC2626"
            />

            <Text style={styles.cancelButtonText}>
              Annuler
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },

  title: {
    color: "#12355B",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 16,
  },

  avatarContainer: {
    alignSelf: "center",
    position: "relative",
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#22C55E",
  },

  defaultAvatar: {
    width: 110,
    height: 110,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#22C55E",
    borderRadius: 55,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "bold",
  },

  previewBadge: {
    position: "absolute",
    right: -8,
    bottom: 5,
    backgroundColor: "#12355B",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  previewBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },

  buttons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  cameraButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#12355B",
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  galleryButton: {
    flex: 1,
    minHeight: 46,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#12355B",
    borderRadius: 10,
    paddingHorizontal: 10,
  },

  disabledButton: {
    opacity: 0.55,
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 6,
  },

  galleryButtonText: {
    color: "#12355B",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 6,
  },

  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },

  loadingText: {
    color: "#64748B",
    fontSize: 14,
    marginLeft: 8,
  },

  information: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 14,
  },

  confirmationButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  confirmButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#22C55E",
    borderRadius: 10,
  },

  confirmButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 5,
  },

  cancelButton: {
    flex: 1,
    minHeight: 45,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
  },

  cancelButtonText: {
    color: "#DC2626",
    fontWeight: "bold",
    marginLeft: 5,
  },
});