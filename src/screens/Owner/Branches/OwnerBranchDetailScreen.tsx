import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useOwnerBranchesStore } from '../../../stores/owner-branches.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { OwnerBranchesStackParamList } from '../../../types/navigation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type RouteParams = RouteProp<OwnerBranchesStackParamList, 'OwnerBranchDetail'>;

export function OwnerBranchDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { branchId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { currentBranch: branch, isLoadingDetail, fetchBranchById } = useOwnerBranchesStore();

  useEffect(() => {
    fetchBranchById(branchId);
  }, [branchId]);

  if (isLoadingDetail || !branch) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const imageUri = branch.images?.[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>
          {t('owner.branchDetails')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image */}
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? colors.navyLight : '#E8EAF0' }]}>
            <Ionicons name="business" size={48} color={isDark ? '#556080' : '#B0B5C5'} />
          </View>
        )}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: tc.cardBg }]}>
          <Text style={[styles.branchName, { color: tc.textPrimary }]}>{branch.name}</Text>

          <View style={styles.badges}>
            <View style={[styles.badge, {
              backgroundColor: branch.isActive ? 'rgba(0,193,106,0.1)' : 'rgba(255,68,68,0.1)',
            }]}>
              <Text style={[styles.badgeText, {
                color: branch.isActive ? '#00C16A' : '#FF4444',
              }]}>
                {branch.isActive ? t('owner.active') : t('owner.inactive')}
              </Text>
            </View>
            {branch.isFeatured && (
              <View style={[styles.badge, { backgroundColor: 'rgba(255,149,0,0.1)' }]}>
                <Text style={[styles.badgeText, { color: '#FF9500' }]}>Featured</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Detail rows */}
          <DetailRow icon="football-outline" label={t('owner.sport')} value={branch.sport?.name || '-'} tc={tc} />
          <DetailRow icon="call-outline" label={t('owner.phone')} value={branch.phone || '-'} tc={tc} />
          <DetailRow
            icon="location-outline"
            label={t('owner.address')}
            value={[branch.address?.street, branch.address?.city, branch.address?.country].filter(Boolean).join(', ') || '-'}
            tc={tc}
          />
        </View>

        {/* Venues */}
        {branch.venues && branch.venues.length > 0 && (
          <View style={[styles.section, { backgroundColor: tc.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
              {t('owner.venuesPlural')} ({branch.venues.length})
            </Text>
            {branch.venues.map((venue) => (
              <View key={venue.id} style={[styles.venueItem, { borderColor: tc.border }]}>
                <Ionicons name="football" size={18} color={isDark ? '#8A94B0' : colors.navy} />
                <View style={styles.venueInfo}>
                  <Text style={[styles.venueName, { color: tc.textPrimary }]}>{venue.name}</Text>
                  <Text style={[styles.venueCapacity, { color: tc.textSecondary }]}>
                    {venue.playerCapacity} {t('owner.players')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Facilities */}
        {branch.facilities && branch.facilities.length > 0 && (
          <View style={[styles.section, { backgroundColor: tc.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>
              {t('owner.facilities')} ({branch.facilities.length})
            </Text>
            <View style={styles.facilitiesGrid}>
              {branch.facilities.map((f) => (
                <View key={f.id} style={[styles.facilityChip, { backgroundColor: isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8' }]}>
                  <Ionicons name="checkmark-circle" size={14} color={isDark ? '#8A94B0' : colors.navy} />
                  <Text style={[styles.facilityName, { color: tc.textPrimary }]}>{f.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, tc }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; tc: any }) {
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={tc.textHint} />
      <View style={styles.detailInfo}>
        <Text style={[styles.detailLabel, { color: tc.textHint }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: tc.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.card,
    marginBottom: spacing.lg,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  infoCard: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  branchName: {
    fontSize: 22,
    fontWeight: '800',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: spacing.md,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  section: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  venueInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 14,
    fontWeight: '600',
  },
  venueCapacity: {
    fontSize: 12,
    marginTop: 2,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  facilityName: {
    fontSize: 13,
    fontWeight: '500',
  },
});
