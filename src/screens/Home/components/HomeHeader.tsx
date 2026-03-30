import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../theme/colors";
import { useThemeStore } from "../../../stores/theme.store";
import { spacing } from "../../../theme/spacing";
import { useTranslation } from "react-i18next";
import { Badge } from "../../../components/ui/Badge";
import { useNotificationsStore } from "../../../stores/notifications.store";
import { useAuthStore } from "../../../stores/auth.store";

interface HomeHeaderProps {
  onNotificationPress: () => void;
  onSearchPress?: () => void;
  onAvatarPress?: () => void;
}

export function HomeHeader({
  onNotificationPress,
  onSearchPress,
  onAvatarPress,
}: HomeHeaderProps) {
  const { t } = useTranslation();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const user = useAuthStore((s) => s.user);
  const insets = useSafeAreaInsets();
  const isDark = useThemeStore((s) => s.isDark);
  const headerBg = isDark ? "#040B1E" : colors.navy;

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, backgroundColor: headerBg },
      ]}
    >
      {/* Top row: Lebanon + bell + avatar */}
      <View style={styles.topRow}>
        <View style={styles.countryRow}>
          <Text style={styles.countryText}>{t('home.lebanon')}</Text>
          <Text style={styles.flag}> 🇱🇧</Text>
        </View>
        <View style={styles.rightIcons}>
          <TouchableOpacity
            onPress={onNotificationPress}
            style={styles.bellContainer}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={colors.white}
            />
            <Badge count={unreadCount} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
              {user?.image ? (
                <Image
                  source={{ uri: user.image }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        onPress={onSearchPress}
        activeOpacity={0.8}
        style={styles.searchBar}
      >
        <Ionicons name="search" size={18} color={colors.textHint} />
        <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
        <View style={styles.filterButton}>
          <Ionicons name="options-outline" size={18} color={colors.white} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 18,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  countryText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
  },
  flag: {
    fontSize: 20,
  },
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bellContainer: {
    position: "relative",
    padding: 4,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  avatarFallback: {
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 4,
    height: 44,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    marginLeft: 10,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
});
