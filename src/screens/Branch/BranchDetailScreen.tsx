import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  Share,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ErrorState } from "../../components/ui/ErrorState";
import { colors } from "../../theme/colors";
import { useThemeColors } from "../../theme/useThemeColors";
import { spacing } from "../../theme/spacing";
import { useThemeStore } from "../../stores/theme.store";
import { useBranchesStore } from "../../stores/branches.store";
import { Venue, Facility } from "../../types/api";
import { HomeStackParamList } from "../../types/navigation";
import { BranchDetailSkeleton } from "./components/BranchDetailSkeleton";
import { BackgroundShapes } from "../../components/ui/BackgroundShapes";
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<HomeStackParamList, "BranchDetail">;

type TabType = "stadiums" | "facilities";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_HEIGHT = 300;

export function BranchDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { branchId, preselectedCoachId } = route.params;
  const { currentBranch, isLoading, error, fetchBranchById } =
    useBranchesStore();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const [activeTab, setActiveTab] = useState<TabType>("stadiums");
  useEffect(() => {
    fetchBranchById(branchId);
  }, [branchId]);

  const handleLocationPress = () => {
    if (!currentBranch?.address) return;
    const { latitude, longitude } = currentBranch.address;
    if (latitude && longitude) {
      const url = Platform.select({
        ios: `maps:0,0?q=${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`,
      });
      if (url) Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    if (!currentBranch) return;
    try {
      await Share.share({
        message: t('branch.shareMessage', { name: currentBranch.name }),
      });
    } catch {}
  };

  if (isLoading && !currentBranch) {
    return <BranchDetailSkeleton />;
  }

  if (error || !currentBranch) {
    return (
      <ErrorState
        message={error || t('branch.notFound')}
        onRetry={() => fetchBranchById(branchId)}
      />
    );
  }

  const branch = currentBranch;
  const venueCount = branch.venues?.length || 0;
  const firstImage = branch.images?.[0];

  return (
    <View style={[styles.container, { backgroundColor: tc.screenBg }]}>
      {/* Image pinned behind everything */}
      <View style={styles.imageContainer}>
        {firstImage ? (
          <Image
            source={{ uri: firstImage }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]}>
            <Ionicons name="football-outline" size={48} color={tc.textHint} />
          </View>
        )}
      </View>

      {/* Header buttons — float above image */}
      <View style={[styles.headerButtons, { top: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Ionicons name="share-outline" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content slides up over the fixed image */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Spacer so card starts at image bottom */}
        <View style={{ height: IMAGE_HEIGHT - 24 }} />
        <View style={[styles.contentCard, { backgroundColor: tc.screenBg }]}>
          <BackgroundShapes isDark={isDark} />
          {/* Branch name and venue count */}
          <View style={styles.nameRow}>
            <Text style={[styles.name, { color: tc.textPrimary }]}>
              {branch.name}
            </Text>
            {venueCount > 0 && (
              <Text style={styles.venueCount}>
                {venueCount} {venueCount === 1 ? t('branch.stadium') : t('branch.stadiums')}
              </Text>
            )}
          </View>

          {/* Location */}
          {branch.address && (
            <View style={styles.locationRow}>
              <Ionicons
                name="location-outline"
                size={16}
                color={isDark ? colors.navyLight : colors.navy}
              />
              <Text style={[styles.locationText, { color: tc.textSecondary }]}>
                {[
                  branch.address.city,
                  branch.address.state || branch.address.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </Text>
            </View>
          )}

          {/* Location button */}
          <TouchableOpacity
            style={styles.locationBtn}
            onPress={handleLocationPress}
          >
            <Ionicons
              name="location-outline"
              size={18}
              color={isDark ? colors.navyLight : colors.navy}
            />
            <Text style={styles.locationBtnText}>{t('branch.location')}</Text>
          </TouchableOpacity>

          {/* Tabs */}
          <View style={[styles.tabs, { borderBottomColor: tc.border }]}>
            <TouchableOpacity
              onPress={() => setActiveTab("stadiums")}
              style={[
                styles.tab,
                activeTab === "stadiums" && [
                  styles.activeTab,
                  { borderBottomColor: tc.textPrimary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tc.textHint },
                  activeTab === "stadiums" && {
                    color: tc.textPrimary,
                    fontWeight: "700",
                  },
                ]}
              >
                {t('branch.stadiums')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("facilities")}
              style={[
                styles.tab,
                activeTab === "facilities" && [
                  styles.activeTab,
                  { borderBottomColor: tc.textPrimary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tc.textHint },
                  activeTab === "facilities" && {
                    color: tc.textPrimary,
                    fontWeight: "700",
                  },
                ]}
              >
                {t('branch.facilities')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab content */}
          {activeTab === "stadiums" ? (
            <View style={styles.tabContent}>
              {branch.venues && branch.venues.length > 0 ? (
                branch.venues.map((venue) => (
                  <VenueListItem
                    key={venue.id}
                    venue={venue}
                    onPress={() =>
                      navigation.navigate("VenueDetail", { venueId: venue.id, preselectedCoachId })
                    }
                  />
                ))
              ) : (
                <Text style={[styles.emptyText, { color: tc.textHint }]}>
                  {t('branch.noStadiums')}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.facilitiesGrid}>
              {branch.facilities && branch.facilities.length > 0 ? (
                branch.facilities.map((facility) => (
                  <FacilityGridItem key={facility.id} facility={facility} />
                ))
              ) : (
                <View style={styles.emptyFacilities}>
                  <Ionicons
                    name="fitness-outline"
                    size={40}
                    color={tc.textHint}
                  />
                  <Text style={[styles.emptyText, { color: tc.textHint }]}>
                    {t('branch.noFacilities')}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  );
}

function VenueListItem({
  venue,
  onPress,
}: {
  venue: Venue;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const tc = useThemeColors();
  const lowestPrice = venue.availability
    ?.flatMap((a) => a.slots || [])
    .reduce((min, slot) => (slot.price < min ? slot.price : min), Infinity);
  const priceDisplay =
    lowestPrice && lowestPrice !== Infinity
      ? `${lowestPrice.toLocaleString()} $`
      : null;
  const venueTypeName = venue.venueTypes?.[0]?.name || null;

  return (
    <TouchableOpacity
      style={[styles.venueCard, { backgroundColor: tc.cardBg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {venue.images?.[0] ? (
        <Image
          source={{ uri: venue.images[0] }}
          style={styles.venueImage}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.venueImage,
            styles.venueImagePlaceholder,
            { backgroundColor: tc.surface },
          ]}
        >
          <Ionicons name="football-outline" size={28} color={tc.textHint} />
        </View>
      )}
      <View style={styles.venueInfo}>
        <Text
          style={[styles.venueName, { color: tc.textPrimary }]}
          numberOfLines={1}
        >
          {venue.name}
        </Text>
        <View style={styles.venueMetaRow}>
          <Ionicons name="people-outline" size={14} color={tc.textSecondary} />
          <Text style={[styles.venueMetaText, { color: tc.textSecondary }]}>
            {venue.playerCapacity} {t('branch.players')}
          </Text>
        </View>
        {priceDisplay && (
          <View style={styles.venueMetaRow}>
            <Ionicons name="card-outline" size={14} color={tc.textSecondary} />
            <Text style={[styles.venueMetaText, { color: tc.textSecondary }]}>
              {priceDisplay}
            </Text>
          </View>
        )}
        {venueTypeName && (
          <View style={styles.venueMetaRow}>
            <Ionicons
              name={
                venueTypeName.toLowerCase().includes("indoor")
                  ? "home-outline"
                  : "sunny-outline"
              }
              size={14}
              color={tc.textSecondary}
            />
            <Text style={[styles.venueMetaText, { color: tc.textSecondary }]}>
              {venueTypeName}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const FACILITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  parking: "car-outline",
  pool: "water-outline",
  swimming: "water-outline",
  gym: "barbell-outline",
  shower: "water-outline",
  locker: "lock-closed-outline",
  cafe: "cafe-outline",
  restaurant: "restaurant-outline",
  wifi: "wifi-outline",
  prayer: "moon-outline",
  changing: "shirt-outline",
  store: "storefront-outline",
  shop: "storefront-outline",
  medical: "medkit-outline",
  first: "medkit-outline",
};

function getFacilityIcon(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(FACILITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "cube-outline";
}

function FacilityGridItem({ facility }: { facility: Facility }) {
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const hasImage = !!(facility.images?.[0] || facility.type?.image);
  const imageUri = facility.images?.[0] || facility.type?.image;

  return (
    <View style={[styles.facilityCard, { backgroundColor: tc.cardBg }]}>
      {hasImage ? (
        <Image
          source={{ uri: imageUri }}
          style={styles.facilityImage}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.facilityIconWrap,
            { backgroundColor: isDark ? 'rgba(19,36,82,0.5)' : `${colors.navy}12` },
          ]}
        >
          <Ionicons
            name={getFacilityIcon(facility.name)}
            size={26}
            color={isDark ? colors.navyLight : colors.navy}
          />
        </View>
      )}
      <Text
        style={[styles.facilityName, { color: tc.textPrimary }]}
        numberOfLines={2}
      >
        {facility.name}
      </Text>
      {facility.type && (
        <Text
          style={[styles.facilityType, { color: tc.textSecondary }]}
          numberOfLines={1}
        >
          {facility.type.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    ...StyleSheet.absoluteFillObject,
  },
  headerButtons: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: IMAGE_HEIGHT,
    overflow: "hidden",
  },
  imagePlaceholder: {
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  contentCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 28,
    paddingHorizontal: spacing.screenPadding,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    flex: 1,
  },
  venueCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.navy,
    marginLeft: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 16,
  },
  locationText: {
    fontSize: 14,
  },
  locationBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.navy,
    marginBottom: 24,
  },
  locationBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.navy,
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    gap: 32,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  tabContent: {
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
  venueCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
  },
  venueImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  venueImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  venueInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 4,
  },
  venueName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  venueMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  venueMetaText: {
    fontSize: 13,
  },
  facilitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  facilityCard: {
    width: (SCREEN_WIDTH - spacing.screenPadding * 2 - 12) / 2,
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
  },
  facilityImage: {
    width: "100%",
    height: 80,
    borderRadius: 10,
    marginBottom: 10,
  },
  facilityIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  facilityName: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  facilityType: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
  emptyFacilities: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
});
