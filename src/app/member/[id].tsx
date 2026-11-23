import {
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getMemberById } from "../../services/memberService";
import { Member } from "../../types/member";

export default function MemberDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{
    id: string | string[];
  }>();

  const [member, setMember] = useState<Member | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const memberId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    async function loadMember() {
      if (!memberId) {
        setError("Identifiant du membre manquant.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const firestoreMember =
          await getMemberById(memberId);

        if (!firestoreMember) {
          setError("Membre introuvable.");
          return;
        }

        setMember(firestoreMember);
      } catch (loadError) {
        console.error(loadError);
        setError(
          "Impossible de charger le profil du membre."
        );
      } finally {
        setLoading(false);
      }
    }

    loadMember();
  }, [memberId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#22C55E"
        />

        <Text style={styles.loadingText}>
          Chargement du profil...
        </Text>
      </View>
    );
  }

  if (error !== "" || !member) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>
          {error || "Membre introuvable."}
        </Text>

        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {member.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text style={styles.title}>{member.name}</Text>

      <Text style={styles.activity}>
        {member.activity}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Niveau</Text>
        <Text style={styles.value}>{member.level}</Text>

        <Text style={styles.label}>Salle</Text>
        <Text style={styles.value}>{member.gym}</Text>

        <Text style={styles.label}>Disponibilité</Text>
        <Text style={styles.value}>
          {member.availability}
        </Text>

        <Text style={styles.label}>Objectif</Text>
        <Text style={styles.value}>{member.goal}</Text>
      </View>

      <Pressable
        style={styles.requestButton}
        onPress={() =>
          router.push({
            pathname: "/request/[id]",
            params: {
              id: member.id,
            },
          })
        }
      >
        <Text style={styles.buttonText}>
          Proposer une séance
        </Text>
      </Pressable>

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.buttonText}>Retour</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 24,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 24,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#22C55E",
    marginTop: 30,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "bold",
  },

  title: {
    color: "#12355B",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 16,
  },

  activity: {
    color: "#22C55E",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 5,
  },

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 25,
  },

  label: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 12,
  },

  value: {
    color: "#1F2937",
    fontSize: 17,
    fontWeight: "500",
    marginTop: 3,
  },

  requestButton: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#22C55E",
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 25,
  },

  backButton: {
    alignItems: "center",
    backgroundColor: "#12355B",
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 13,
    marginTop: 15,
  },

  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  loadingText: {
    color: "#64748B",
    fontSize: 16,
    marginTop: 12,
  },

  errorText: {
    color: "#DC2626",
    fontSize: 17,
    textAlign: "center",
  },
});