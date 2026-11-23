import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  colors,
  radius,
  shadows,
  spacing,
} from "../theme";
import { Member } from "../types/member";

type MemberCardProps = {
  member: Member;
};

export default function MemberCard({
  member,
}: MemberCardProps) {
  const router = useRouter();

  const openProfile = () => {
    router.push({
      pathname: "/member/[id]",
      params: {
        id: member.id,
      },
    });
  };

  return (
    <View style={styles.card}>
      <View style={styles.topSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {member.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.information}>
          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {member.name}
          </Text>

          <View style={styles.gymRow}>
            <Ionicons
              name="location-outline"
              size={15}
              color={colors.textMuted}
            />

            <Text
              style={styles.gym}
              numberOfLines={1}
            >
              {member.gym}
            </Text>
          </View>
        </View>

        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>
            {member.level}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.activityRow}>
        <View style={styles.activityBadge}>
          <Ionicons
            name="barbell-outline"
            size={16}
            color={colors.secondaryDark}
          />

          <Text style={styles.activityText}>
            {member.activity}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Ionicons
          name="time-outline"
          size={17}
          color={colors.textMuted}
        />

        <Text style={styles.detail}>
          {member.availability}
        </Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons
          name="flag-outline"
          size={17}
          color={colors.textMuted}
        />

        <Text
          style={styles.detail}
          numberOfLines={2}
        >
          {member.goal}
        </Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.pressedButton,
        ]}
        onPress={openProfile}
        accessibilityRole="button"
        accessibilityLabel={
          `Voir le profil de ${member.name}`
        }
      >
        <Text style={styles.buttonText}>
          Voir le profil
        </Text>

        <Ionicons
          name="arrow-forward"
          size={18}
          color={colors.white}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  topSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.secondary,
  },

  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "bold",
  },

  information: {
    flex: 1,
    marginLeft: spacing.md,
  },

  name: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "bold",
  },

  gymRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },

  gym: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 13,
    marginLeft: spacing.xs,
  },

  levelBadge: {
    backgroundColor: colors.background,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginLeft: spacing.sm,
  },

  levelText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },

  activityRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },

  activityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.secondaryLight,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },

  activityText: {
    color: colors.secondaryDark,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.sm,
  },

  detail: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },

  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },

  pressedButton: {
    opacity: 0.8,
  },

  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "bold",
    marginRight: spacing.sm,
  },
});