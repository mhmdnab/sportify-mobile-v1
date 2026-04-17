import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from "react-native-reanimated";
import { colors } from "../../../theme/colors";
import { useThemeStore } from "../../../stores/theme.store";
import { spacing } from "../../../theme/spacing";
import { useNotificationsStore } from "../../../stores/notifications.store";
import { useAuthStore } from "../../../stores/auth.store";
import { Badge } from "../../../components/ui/Badge";

interface HomeHeaderProps {
  onNotificationPress: () => void;
  onAvatarPress?: () => void;
  scrollY: SharedValue<number>;
}

function getGreeting(): { emoji: string; text: string } {
  const h = new Date().getHours();
  if (h < 12) return { emoji: "☀️", text: "Good Morning" };
  if (h < 17) return { emoji: "🌤️", text: "Good Afternoon" };
  return { emoji: "🌙", text: "Good Evening" };
}

function getDateStr(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function HomeHeader({ onNotificationPress, onAvatarPress, scrollY }: HomeHeaderProps) {
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const isDark = useThemeStore((s) => s.isDark);

  const { emoji, text } = getGreeting();
  const dateStr = getDateStr();
  const cardBg = isDark ? "#0B1740" : colors.navy;

  // Phase 1: 0→70  — card compresses (greeting/date fade, padding shrinks)
  // Phase 2: 70→130 — whole card fades and slides up

  const cardStyle = useAnimatedStyle(() => {
    const paddingVertical = interpolate(scrollY.value, [0, 70], [20, 10], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [70, 130], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [70, 130], [0, -20], Extrapolation.CLAMP);
    return { paddingVertical, opacity, transform: [{ translateY }] };
  });

  const greetDateStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, 55], [1, 0], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 55], [0, -8], Extrapolation.CLAMP);
    return { opacity, transform: [{ translateY }] };
  });

  const nameStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(scrollY.value, [0, 70], [26, 19], Extrapolation.CLAMP);
    const translateY = interpolate(scrollY.value, [0, 70], [0, -4], Extrapolation.CLAMP);
    return { fontSize, transform: [{ translateY }] };
  });

  const iconsStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [0, 70], [0, 6], Extrapolation.CLAMP);
    return { transform: [{ translateY }] };
  });

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + 12 }]}>
      <Animated.View style={[styles.card, { backgroundColor: cardBg }, cardStyle]}>
        {/* Decorative circles */}
        <View style={[styles.decoCircle, { width: 170, height: 170, right: 50, top: -50 }]} />
        <View style={[styles.decoCircle, { width: 110, height: 110, right: -18, bottom: -35, opacity: 0.08 }]} />

        {/* Left column */}
        <View style={styles.left}>
          <Animated.View style={[styles.greetRow, greetDateStyle]}>
            <Text style={styles.greetEmoji}>{emoji}</Text>
            <Text style={styles.greetText}>{text}</Text>
          </Animated.View>

          <Animated.Text style={[styles.name, nameStyle]} numberOfLines={1}>
            {user?.name ?? "User"}
          </Animated.Text>

          <Animated.Text style={[styles.date, greetDateStyle]}>
            {dateStr}
          </Animated.Text>
        </View>

        {/* Right icons */}
        <Animated.View style={[styles.right, iconsStyle]}>
          <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7} style={styles.iconBtn}>
            <View style={styles.burgerLine} />
            <View style={[styles.burgerLine, { width: 14 }]} />
            <View style={[styles.burgerLine, { width: 18 }]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onNotificationPress} style={styles.iconBtn} activeOpacity={0.7}>
            <Ionicons name="notifications-outline" size={20} color="rgba(255,255,255,0.8)" />
            <Badge count={unreadCount} />
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 4,
    marginBottom: 8,
  },
  card: {
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    overflow: "hidden",
    minHeight: 64,
    ...Platform.select({
      ios: {
        shadowColor: colors.navy,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 18,
      },
      android: { elevation: 8 },
    }),
  },
  decoCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  left: { flex: 1, zIndex: 1 },
  greetRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 5 },
  greetEmoji: { fontSize: 15 },
  greetText: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: "500" },
  name: { fontWeight: "800", color: "#fff", marginBottom: 5, letterSpacing: -0.3 },
  date: { fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: "400" },
  right: { alignItems: "center", gap: 14, zIndex: 1, paddingTop: 2 },
  iconBtn: {
    position: "relative",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  burgerLine: {
    width: 20,
    height: 2,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
