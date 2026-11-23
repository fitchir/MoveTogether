import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  signOut,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import ProfilePhotoPicker from "../../components/ProfilePhotoPicker";
import { useAuth } from "../../contexts/AuthContext";
import { auth } from "../../services/firebase";
import {
  getUserProfile,
  ProfileData,
  saveUserProfile,
} from "../../services/profileService";
import {
  colors,
  radius,
  shadows,
  spacing,
} from "../../theme";

const gyms = [
  "Campus Gym SQY",
  "Move Center Versailles",
  "Fitness Club Paris",
];

const levels = [
  "Débutant",
  "Intermédiaire",
  "Confirmé",
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [firstname, setFirstname] = useState(
    user?.displayName ?? ""
  );
  const [activity, setActivity] = useState("");
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [availability, setAvailability] =
    useState("");
  const [selectedGym, setSelectedGym] =
    useState("");

  const [savedProfile, setSavedProfile] =
    useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] =
    useState(false);
  const [profileLoading, setProfileLoading] =
    useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const applyProfile = (
    profile: ProfileData
  ) => {
    setFirstname(profile.firstname);
    setActivity(profile.activity);
    setLevel(profile.level);
    setGoal(profile.goal);
    setAvailability(profile.availability);
    setSelectedGym(profile.gym);
  };

  useEffect(() => {
    let screenIsActive = true;

    const loadProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const profile =
          await getUserProfile(user.uid);

        if (!screenIsActive) {
          return;
        }

        if (profile) {
          applyProfile(profile);
          setSavedProfile(profile);
          setIsEditing(false);
        } else {
          setIsEditing(true);
        }
      } catch (error) {
        console.error(error);

        if (screenIsActive) {
          Alert.alert(
            "Erreur",
            "Impossible de charger votre profil."
          );
        }
      } finally {
        if (screenIsActive) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      screenIsActive = false;
    };
  }, [user]);

  const saveProfile = async () => {
    const cleanFirstname = firstname.trim();
    const cleanActivity = activity.trim();
    const cleanGoal = goal.trim();
    const cleanAvailability =
      availability.trim();

    if (
      cleanFirstname === "" ||
      cleanActivity === "" ||
      level === "" ||
      selectedGym === ""
    ) {
      Alert.alert(
        "Profil incomplet",
        "Veuillez remplir le prénom, l’activité, le niveau et la salle."
      );
      return;
    }

    if (!user) {
      Alert.alert(
        "Session introuvable",
        "Veuillez vous reconnecter."
      );
      return;
    }

    const updatedProfile: ProfileData = {
      firstname: cleanFirstname,
      email: user.email ?? "",
      activity: cleanActivity,
      level,
      goal: cleanGoal,
      availability: cleanAvailability,
      gym: selectedGym,
    };

    try {
      setSaving(true);

      await saveUserProfile(
        user.uid,
        updatedProfile
      );

      await updateProfile(user, {
        displayName: cleanFirstname,
      });

      setSavedProfile(updatedProfile);
      setIsEditing(false);

      Alert.alert(
        "Profil enregistré",
        "Vos informations ont bien été mises à jour."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Erreur",
        "Impossible d’enregistrer votre profil."
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    if (savedProfile) {
      applyProfile(savedProfile);
      setIsEditing(false);
    }
  };

  const openGymSelection = () => {
    router.push("/choose-gym");
  };

  const logout = async () => {
    try {
      setLogoutLoading(true);

      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Erreur",
        "Impossible de vous déconnecter."
      );
    } finally {
      setLogoutLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Chargement du profil...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {firstname
                ? firstname
                    .charAt(0)
                    .toUpperCase()
                : "M"}
            </Text>
          </View>

          <Text style={styles.title}>
            {firstname || "Mon profil"}
          </Text>

          {user?.email && (
            <Text style={styles.email}>
              {user.email}
            </Text>
          )}

          {!isEditing && (
            <Pressable
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.pressed,
              ]}
              onPress={() =>
                setIsEditing(true)
              }
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.editButtonText}>
                Modifier mon profil
              </Text>
            </Pressable>
          )}
        </View>
        <ProfilePhotoPicker firstname={firstname} />

        {isEditing ? (
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Informations personnelles
            </Text>

            <Text style={styles.label}>
              Prénom *
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                style={styles.input}
                value={firstname}
                onChangeText={setFirstname}
                placeholder="Votre prénom"
                placeholderTextColor={
                  colors.placeholder
                }
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>
              Activité préférée *
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="barbell-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                style={styles.input}
                value={activity}
                onChangeText={setActivity}
                placeholder="Exemple : Musculation"
                placeholderTextColor={
                  colors.placeholder
                }
              />
            </View>

            <Text style={styles.label}>
              Niveau *
            </Text>

            <View style={styles.options}>
              {levels.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.option,
                    level === item &&
                      styles.selectedOption,
                  ]}
                  onPress={() => setLevel(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      level === item &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>
              Objectif
            </Text>

            <View
              style={[
                styles.inputContainer,
                styles.largeInputContainer,
              ]}
            >
              <Ionicons
                name="flag-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                style={[
                  styles.input,
                  styles.largeInput,
                ]}
                value={goal}
                onChangeText={setGoal}
                placeholder="Exemple : pratiquer régulièrement"
                placeholderTextColor={
                  colors.placeholder
                }
                multiline
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.label}>
              Disponibilités
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="time-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                style={styles.input}
                value={availability}
                onChangeText={setAvailability}
                placeholder="Exemple : samedi matin"
                placeholderTextColor={
                  colors.placeholder
                }
              />
            </View>

            <Text style={styles.label}>
              Salle *
            </Text>

            <View style={styles.gyms}>
              {gyms.map((gym) => {
                const isSelected =
                  selectedGym === gym;

                return (
                  <Pressable
                    key={gym}
                    style={[
                      styles.gym,
                      isSelected &&
                        styles.selectedGym,
                    ]}
                    onPress={() =>
                      setSelectedGym(gym)
                    }
                  >
                    <View
                      style={[
                        styles.radio,
                        isSelected &&
                          styles.selectedRadio,
                      ]}
                    />

                    <View style={styles.gymContent}>
                      <Text style={styles.gymText}>
                        {gym}
                      </Text>

                      {isSelected && (
                        <Text
                          style={
                            styles.selectedGymText
                          }
                        >
                          Salle sélectionnée
                        </Text>
                      )}
                    </View>

                    <Ionicons
                      name="location-outline"
                      size={20}
                      color={
                        isSelected
                          ? colors.secondary
                          : colors.textMuted
                      }
                    />
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={styles.chooseGymButton}
              onPress={openGymSelection}
            >
              <Ionicons
                name="navigate-outline"
                size={21}
                color={colors.white}
              />

              <Text
                style={styles.chooseGymButtonText}
              >
                Trouver une salle à proximité
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.saveButton,
                saving &&
                  styles.disabledButton,
              ]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator
                  color={colors.white}
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color={colors.white}
                  />

                  <Text style={styles.saveButtonText}>
                    Enregistrer mon profil
                  </Text>
                </>
              )}
            </Pressable>

            {savedProfile && (
              <Pressable
                style={styles.cancelButton}
                onPress={cancelEditing}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>
                  Annuler
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <View style={styles.profileCard}>
              <Text style={styles.sectionTitle}>
                Mon profil sportif
              </Text>

              <ProfileInformation
                icon="barbell-outline"
                label="Activité préférée"
                value={
                  activity || "Non renseignée"
                }
              />

              <ProfileInformation
                icon="trending-up-outline"
                label="Niveau"
                value={level || "Non renseigné"}
              />

              <ProfileInformation
                icon="flag-outline"
                label="Objectif"
                value={goal || "Non renseigné"}
              />

              <ProfileInformation
                icon="time-outline"
                label="Disponibilités"
                value={
                  availability ||
                  "Non renseignées"
                }
              />

              <ProfileInformation
                icon="location-outline"
                label="Salle"
                value={
                  selectedGym ||
                  "Non renseignée"
                }
                isLast
              />

              <Pressable
                style={styles.chooseGymButton}
                onPress={openGymSelection}
              >
                <Ionicons
                  name="navigate-outline"
                  size={21}
                  color={colors.white}
                />

                <Text
                  style={styles.chooseGymButtonText}
                >
                  Choisir une salle à proximité
                </Text>
              </Pressable>
            </View>

            <View style={styles.accountCard}>
              <Text style={styles.sectionTitle}>
                Mon compte
              </Text>

              <View style={styles.accountRow}>
                <View style={styles.accountIcon}>
                  <Ionicons
                    name="mail-outline"
                    size={21}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.accountInfo}>
                  <Text
                    style={styles.informationLabel}
                  >
                    Adresse e-mail
                  </Text>

                  <Text
                    style={styles.informationValue}
                  >
                    {user?.email ??
                      "Non renseignée"}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        <Pressable
          style={[
            styles.logoutButton,
            logoutLoading &&
              styles.disabledButton,
          ]}
          onPress={logout}
          disabled={logoutLoading || saving}
        >
          {logoutLoading ? (
            <ActivityIndicator
              color={colors.danger}
            />
          ) : (
            <>
              <Ionicons
                name="log-out-outline"
                size={21}
                color={colors.danger}
              />

              <Text style={styles.logoutButtonText}>
                Se déconnecter
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type ProfileInformationProps = {
  icon:
    | "barbell-outline"
    | "trending-up-outline"
    | "flag-outline"
    | "time-outline"
    | "location-outline";
  label: string;
  value: string;
  isLast?: boolean;
};

function ProfileInformation({
  icon,
  label,
  value,
  isLast = false,
}: ProfileInformationProps) {
  return (
    <View
      style={[
        styles.informationRow,
        isLast && styles.lastInformationRow,
      ]}
    >
      <View style={styles.informationIcon}>
        <Ionicons
          name={icon}
          size={22}
          color={colors.primary}
        />
      </View>

      <View style={styles.informationContent}>
        <Text style={styles.informationLabel}>
          {label}
        </Text>

        <Text style={styles.informationValue}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingBottom: 45,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  loadingText: {
    color: colors.textMuted,
    marginTop: spacing.md,
  },

  profileHeader: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  avatar: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderWidth: 4,
    borderColor: colors.surface,
    borderRadius: 45,
    ...shadows.card,
  },

  avatarText: {
    color: colors.white,
    fontSize: 37,
    fontWeight: "bold",
  },

  title: {
    color: colors.primary,
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: spacing.md,
  },

  email: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    marginTop: spacing.xs,
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },

  editButtonText: {
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },

  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.card,
  },

  accountCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.lg,
    ...shadows.card,
  },

  sectionTitle: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },

  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },

  largeInputContainer: {
    alignItems: "flex-start",
    paddingTop: spacing.md,
  },

  largeInput: {
    minHeight: 80,
    paddingTop: 0,
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  option: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },

  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  optionText: {
    color: colors.textMuted,
  },

  selectedOptionText: {
    color: colors.white,
    fontWeight: "bold",
  },

  gyms: {
    gap: spacing.sm,
  },

  gym: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  selectedGym: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
  },

  radio: {
    width: 19,
    height: 19,
    borderWidth: 2,
    borderColor: colors.placeholder,
    borderRadius: 10,
    marginRight: spacing.md,
  },

  selectedRadio: {
    borderWidth: 5,
    borderColor: colors.secondary,
  },

  gymContent: {
    flex: 1,
  },

  gymText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "500",
  },

  selectedGymText: {
    color: colors.secondaryDark,
    fontSize: 12,
    marginTop: 2,
  },

  chooseGymButton: {
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  chooseGymButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },

  saveButton: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },

  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },

  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
  },

  informationRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingVertical: spacing.md,
  },

  lastInformationRow: {
    borderBottomWidth: 0,
  },

  informationIcon: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },

  informationContent: {
    flex: 1,
    marginLeft: spacing.md,
  },

  informationLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },

  informationValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 3,
  },

  accountRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  accountIcon: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: radius.md,
  },

  accountInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  logoutButton: {
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },

  logoutButtonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: spacing.sm,
  },

  disabledButton: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.8,
  },
});