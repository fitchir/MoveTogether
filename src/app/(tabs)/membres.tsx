import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import {
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import MemberCard from "../../components/MemberCard";
import { useAuth } from "../../contexts/AuthContext";
import { getMembers } from "../../services/memberService";
import {
  colors,
  radius,
  shadows,
  spacing,
} from "../../theme";
import { Member } from "../../types/member";

export default function MembersScreen() {
  const { user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [selectedActivity, setSelectedActivity] =
    useState("Tous");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState("");

  const loadMembers = useCallback(
    async (refresh = false) => {
      if (!user) {
        setMembers([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const firestoreMembers =
          await getMembers(user.uid);

        setMembers(firestoreMembers);
      } catch (loadError) {
        console.error(loadError);

        setError(
          "Impossible de charger les membres."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user]
  );

  useFocusEffect(
    useCallback(() => {
      loadMembers();
    }, [loadMembers])
  );

  const activities = useMemo(() => {
    const uniqueActivities = new Set(
      members
        .map((member) => member.activity)
        .filter(
          (activity) =>
            activity &&
            activity !== "Non renseignée"
        )
    );

    return [
      "Tous",
      ...Array.from(uniqueActivities),
    ];
  }, [members]);

  const filteredMembers = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return members.filter((member) => {
      const matchesActivity =
        selectedActivity === "Tous" ||
        member.activity === selectedActivity;

      const matchesSearch =
        normalizedSearch === "" ||
        member.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        member.activity
          .toLowerCase()
          .includes(normalizedSearch) ||
        member.gym
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesActivity && matchesSearch;
    });
  }, [
    members,
    search,
    selectedActivity,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSelectedActivity("Tous");
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color={colors.secondary}
        />

        <Text style={styles.loadingText}>
          Chargement des membres...
        </Text>
      </View>
    );
  }

  if (error !== "") {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="cloud-offline-outline"
          size={52}
          color={colors.danger}
        />

        <Text style={styles.errorTitle}>
          Chargement impossible
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>

        <Pressable
          style={styles.retryButton}
          onPress={() => loadMembers()}
        >
          <Text style={styles.retryButtonText}>
            Réessayer
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredMembers}
        keyExtractor={(member) => member.id}
        renderItem={({ item }) => (
          <MemberCard member={item} />
        )}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadMembers(true)}
            colors={[colors.secondary]}
            tintColor={colors.secondary}
          />
        }
        contentContainerStyle={[
          styles.list,
          filteredMembers.length === 0 &&
            styles.emptyList,
        ]}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>
              Trouve ton partenaire
            </Text>

            <Text style={styles.subtitle}>
              Membres disponibles sur MoveTogether
            </Text>

            <View style={styles.searchContainer}>
              <Ionicons
                name="search-outline"
                size={21}
                color={colors.textMuted}
              />

              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Rechercher un membre..."
                placeholderTextColor={
                  colors.placeholder
                }
                returnKeyType="search"
              />

              {search !== "" && (
                <Pressable
                  onPress={() => setSearch("")}
                  accessibilityLabel="Effacer la recherche"
                >
                  <Ionicons
                    name="close-circle"
                    size={21}
                    color={colors.textMuted}
                  />
                </Pressable>
              )}
            </View>

            <Text style={styles.filterTitle}>
              Filtrer par activité
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={
                styles.filters
              }
            >
              {activities.map((activity) => {
                const isSelected =
                  selectedActivity === activity;

                return (
                  <Pressable
                    key={activity}
                    style={[
                      styles.filterButton,
                      isSelected &&
                        styles.selectedFilterButton,
                    ]}
                    onPress={() =>
                      setSelectedActivity(activity)
                    }
                  >
                    <Text
                      style={[
                        styles.filterText,
                        isSelected &&
                          styles.selectedFilterText,
                      ]}
                    >
                      {activity}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.resultText}>
              {filteredMembers.length}{" "}
              {filteredMembers.length > 1
                ? "membres trouvés"
                : "membre trouvé"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="people-outline"
              size={58}
              color={colors.textMuted}
            />

            <Text style={styles.emptyTitle}>
              Aucun membre trouvé
            </Text>

            <Text style={styles.emptyText}>
              {members.length === 0
                ? "Les nouveaux membres apparaîtront ici après leur inscription."
                : "Modifiez votre recherche ou choisissez une autre activité."}
            </Text>

            {(search !== "" ||
              selectedActivity !== "Tous") && (
              <Pressable
                style={styles.resetButton}
                onPress={resetFilters}
              >
                <Text style={styles.resetButtonText}>
                  Réinitialiser les filtres
                </Text>
              </Pressable>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.xxl,
  },

  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: "bold",
    marginTop: spacing.xl,
  },

  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    ...shadows.card,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },

  filterTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },

  filters: {
    paddingRight: spacing.lg,
  },

  filterButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },

  selectedFilterButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  filterText: {
    color: colors.textMuted,
    fontWeight: "600",
  },

  selectedFilterText: {
    color: colors.white,
  },

  resultText: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },

  list: {
    paddingBottom: spacing.xxxl,
  },

  emptyList: {
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xxl,
    paddingBottom: 70,
  },

  emptyTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginTop: spacing.sm,
  },

  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  resetButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },

  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  retryButtonText: {
    color: colors.white,
    fontWeight: "bold",
  },

  loadingText: {
    color: colors.textMuted,
    fontSize: 16,
    marginTop: spacing.md,
  },

  errorTitle: {
    color: colors.primary,
    fontSize: 21,
    fontWeight: "bold",
    marginTop: spacing.md,
  },

  errorText: {
    color: colors.danger,
    fontSize: 16,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});