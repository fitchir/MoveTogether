import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
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

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] =
    useState(false);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (cleanEmail === "" || password === "") {
      Alert.alert(
        "Formulaire incomplet",
        "Veuillez saisir votre e-mail et votre mot de passe."
      );
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(error);

      let message =
        "L’adresse e-mail ou le mot de passe est incorrect.";

      if (error.code === "auth/invalid-email") {
        message = "L’adresse e-mail est invalide.";
      } else if (
        error.code === "auth/too-many-requests"
      ) {
        message =
          "Trop de tentatives. Veuillez réessayer plus tard.";
      } else if (
        error.code === "auth/network-request-failed"
      ) {
        message =
          "Impossible de contacter Firebase. Vérifiez votre connexion.";
      }

      Alert.alert("Connexion impossible", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={
        Platform.OS === "ios" ? "padding" : undefined
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
            size={38}
            color={colors.white}
          />
        </View>

        <Text style={styles.logo}>MoveTogether</Text>

        <Text style={styles.title}>
          Bon retour !
        </Text>

        <Text style={styles.subtitle}>
          Connectez-vous pour retrouver vos partenaires
          et vos prochaines séances.
        </Text>

        <View style={styles.formCard}>
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
              placeholderTextColor={colors.placeholder}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              editable={!loading}
              returnKeyType="next"
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
              placeholder="Votre mot de passe"
              placeholderTextColor={colors.placeholder}
              secureTextEntry={!passwordVisible}
              editable={!loading}
              onSubmitEditing={login}
            />

            <Pressable
              onPress={() =>
                setPasswordVisible(
                  (currentValue) => !currentValue
                )
              }
              accessibilityLabel={
                passwordVisible
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
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

          <Pressable
            style={({ pressed }) => [
              styles.button,
              loading && styles.disabledButton,
              pressed &&
                !loading &&
                styles.pressedButton,
            ]}
            onPress={login}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator
                  size="small"
                  color={colors.white}
                />

                <Text style={styles.buttonText}>
                  Connexion en cours...
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.buttonText}>
                  Se connecter
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={colors.white}
                />
              </>
            )}
          </Pressable>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>
              Pas encore de compte ?
            </Text>

            <Pressable
              onPress={() =>
                router.push("/register")
              }
              disabled={loading}
            >
              <Text style={styles.link}>
                S’inscrire
              </Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>
          Bougez ensemble, progressez ensemble.
        </Text>
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
    width: 75,
    height: 75,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
    borderRadius: 38,
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

  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 13,
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

  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: spacing.xl,
  },

  registerText: {
    color: colors.textMuted,
    fontSize: 15,
  },

  link: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "bold",
    marginLeft: spacing.xs,
  },

  footer: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.xl,
  },
});