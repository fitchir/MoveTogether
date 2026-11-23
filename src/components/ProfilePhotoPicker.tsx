import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

type ProfilePhotoPickerProps = {
  firstname: string;
};

export default function ProfilePhotoPicker({
  firstname,
}: ProfilePhotoPickerProps) {
  const [confirmedPhoto, setConfirmedPhoto] =
    useState<string | null>(null);

  const [temporaryPhoto, setTemporaryPhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(
      null
    );

  const [loading, setLoading] = useState(false);
  const [information, setInformation] =
    useState("");

  const chooseImage = async (
    source: "camera" | "gallery"
  ) => {
    try {
      setLoading(true);
      setInformation("");

      if (source === "camera") {
        const permission =
          await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          setInformation(
            "L’accès à la caméra a été refusé. Vous pouvez choisir une photo dans la galerie."
          );
          return;
        }
      } else {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();

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
          : await ImagePicker.launchImageLibraryAsync(
              options
            );

      if (result.canceled) {
        setInformation(
          "Aucune nouvelle photo n’a été sélectionnée."
        );
        return;
      }

      setTemporaryPhoto(result.assets[0]);

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
      setLoading(false);
    }
  };

  const confirmPhoto = () => {
    if (!temporaryPhoto) {
      return;
    }

    setConfirmedPhoto(temporaryPhoto.uri);
    setTemporaryPhoto(null);

    setInformation(
      "La photo a été confirmée sur cet appareil."
    );
  };

  const cancelPhoto = () => {
    setTemporaryPhoto(null);

    setInformation(
      "La nouvelle photo a été annulée."
    );
  };

  const displayedPhoto =
    temporaryPhoto?.uri ?? confirmedPhoto;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Photo de profil
      </Text>

      <View style={styles.avatarContainer}>
        {displayedPhoto ? (
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
          style={styles.cameraButton}
          onPress={() => chooseImage("camera")}
          disabled={loading}
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
          style={styles.galleryButton}
          onPress={() => chooseImage("gallery")}
          disabled={loading}
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

      {loading && (
        <ActivityIndicator
          color="#22C55E"
          style={styles.loader}
        />
      )}

      {information !== "" && (
        <Text style={styles.information}>
          {information}
        </Text>
      )}

      {temporaryPhoto && (
        <View style={styles.confirmationButtons}>
          <Pressable
            style={styles.confirmButton}
            onPress={confirmPhoto}
          >
            <Ionicons
              name="checkmark-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.confirmButtonText}>
              Confirmer
            </Text>
          </Pressable>

          <Pressable
            style={styles.cancelButton}
            onPress={cancelPhoto}
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

  loader: {
    marginTop: 15,
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