import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
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

import { auth } from "../services/firebase";
import {
  colors,
  radius,
  shadows,
  spacing,
} from "../theme";

export default function RegisterScreen() {
  const router = useRouter();

  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] =
    useState("");
  const [passwordVisible, setPasswordVisible] =
    useState(false);
  const [
    confirmationVisible,
    setConfirmationVisible,
  ] = useState(false);
  const [loading, setLoading] = useState(false);

  const register = async () => {
    const cleanFirstname = firstname.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanFirstname === "" ||
      cleanEmail === "" ||
      password === "" ||
      confirmation === ""
    ) {
      Alert.alert(
        "Formulaire incomplet",
        "Veuillez remplir tous les champs."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Mot de passe invalide",
        "Le mot de passe doit contenir au moins 6 caractères."
      );
      return;
    }

    if (password !== confirmation) {
      Alert.alert(
        "Confirmation incorrecte",
        "Les deux mots de passe sont différents."
      );
      return;
    }

    try {
      setLoading(true);

      const result =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      await updateProfile(result.user, {
        displayName: cleanFirstname,
      });

      Alert.alert(
        "Compte créé",
        `Bienvenue ${cleanFirstname} ! Complétez maintenant votre profil sportif.`
      );

      router.replace("/(tabs)/profil");
    } catch (error: any) {
      console.error(error);

      let message =
        "Une erreur est survenue pendant l’inscription.";

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        message =
          "Cette adresse e-mail est déjà utilisée.";
      } else if (
        error.code === "auth/invalid-email"
      ) {
        message = "L’adresse e-mail est invalide.";
      } else if (
        error.code === "auth/weak-password"
      ) {
        message =
          "Le mot de passe est trop faible.";
      } else if (
        error.code ===
        "auth/network-request-failed"
      ) {
        message =
          "Impossible de contacter Firebase. Vérifiez votre connexion.";
      }

      Alert.alert(
        "Inscription impossible",
        message
      );
    } finally {
      setLoading(false);
    }
  };

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
        <View style={styles.logoContainer}>
          <Ionicons
            name="fitness"
            size={36}
            color={colors.white}
          />
        </View>

        <Text style={styles.logo}>
          MoveTogether
        </Text>

        <Text style={styles.title}>
          Créer un compte
        </Text>

        <Text style={styles.subtitle}>
          Rejoignez la communauté et trouvez votre
          prochain partenaire sportif.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>
            Prénom
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
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>
            Adresse e-mail
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="exemple@email.com"
              placeholderTextColor={
                colors.placeholder
              }
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <Text style={styles.label}>
            Mot de passe
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 6 caractères"
              placeholderTextColor={
                colors.placeholder
              }
              secureTextEntry={!passwordVisible}
              editable={!loading}
            />

            <Pressable
              onPress={() =>
                setPasswordVisible(
                  (currentValue) => !currentValue
                )
              }
            >
              <Ionicons
                name={
                  passwordVisible
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          <View style={styles.passwordHelp}>
            <Ionicons
              name={
                password.length >= 6
                  ? "checkmark-circle"
                  : "information-circle-outline"
              }
              size={16}
              color={
                password.length >= 6
                  ? colors.success
                  : colors.textMuted
              }
            />

            <Text style={styles.passwordHelpText}>
              Au moins 6 caractères
            </Text>
          </View>

          <Text style={styles.label}>
            Confirmer le mot de passe
          </Text>

          <View
            style={[
              styles.inputContainer,
              confirmation !== "" &&
                password !== confirmation &&
                styles.invalidInput,
            ]}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={colors.textMuted}
            />

            <TextInput
              style={styles.input}
              value={confirmation}
              onChangeText={setConfirmation}
              placeholder="Saisissez à nouveau le mot de passe"
              placeholderTextColor={
                colors.placeholder
              }
              secureTextEntry={
                !confirmationVisible
              }
              editable={!loading}
              onSubmitEditing={register}
            />

            <Pressable
              onPress={() =>
                setConfirmationVisible(
                  (currentValue) => !currentValue
                )
              }
            >
              <Ionicons
                name={
                  confirmationVisible
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color={colors.textMuted}
              />
            </Pressable>
          </View>

          {confirmation !== "" &&
            password !== confirmation && (
              <Text style={styles.invalidText}>
                Les mots de passe ne correspondent pas.
              </Text>
            )}

          <Pressable
            style={({ pressed }) => [
              styles.button,
              loading && styles.disabledButton,
              pressed &&
                !loading &&
                styles.pressedButton,
            ]}
            onPress={register}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={colors.white}
                />

                <Text style={styles.buttonText}>
                  Création en cours...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonText}>
                  Créer mon compte
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.white}
                />
              </>
            )}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Déjà un compte ?
            </Text>

            <Pressable
              onPress={() =>
                router.push("/login")
              }
              disabled={loading}
            >
              <Text style={styles.link}>
                Se connecter
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },

  logoContainer: {
    alignSelf: "center",
    width: 72,
    height: 72,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 36,
    ...shadows.card,
  },

  logo: {
    color: colors.secondaryDark,
    fontSize: 23,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: spacing.md,
  },

  title: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: spacing.md,
  },

  subtitle: {
    alignSelf: "center",
    maxWidth: 450,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  formCard: {
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    ...shadows.card,
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

  invalidInput: {
    borderColor: colors.danger,
    marginBottom: spacing.xs,
  },

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 13,
  },

  passwordHelp: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },

  passwordHelpText: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: spacing.xs,
  },

  invalidText: {
    color: colors.danger,
    fontSize: 12,
    marginBottom: spacing.md,
  },

  button: {
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },

  disabledButton: {
    opacity: 0.6,
  },

  pressedButton: {
    opacity: 0.8,
  },

  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: spacing.xl,
  },

  loginText: {
    color: colors.textMuted,
    fontSize: 15,
  },

  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },
});