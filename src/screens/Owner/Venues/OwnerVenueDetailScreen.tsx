import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useOwnerVenuesStore } from '../../../stores/owner-venues.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { OwnerVenuesStackParamList } from '../../../types/navigation';
import { Day } from '../../../types/api';
import { formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

type RouteParams = RouteProp<OwnerVenuesStackParamList, 'OwnerVenueDetail'>;

const dayOrder: Day[] = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY, Day.SATURDAY, Day.SUNDAY];
const dayTranslationKeys: Record<Day, string> = {
  [Day.MONDAY]: 'days.mon',
  [Day.TUESDAY]: 'days.tue',
  [Day.WEDNESDAY]: 'days.wed',
  [Day.THURSDAY]: 'days.thu',
  [Day.FRIDAY]: 'days.fri',
  [Day.SATURDAY]: 'days.sat',
  [Day.SUNDAY]: 'days.sun',
};

export function OwnerVenueDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { venueId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { currentVenue: venue, isLoadingDetail, fetchVenueById } = useOwnerVenuesStore();

  useEffect(() => {
    fetchVenueById(venueId);
  }, [venueId]);

  if (isLoadingDetail || !venue) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const imageUri = venue.images?.[0];
  const typeNames = venue.venueTypes?.map((t) => t.name).join(', ') || '-';
  const sortedAvailability = venue.availability
    ? [...venue.availability].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day))
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]} numberOfLines={1}>
          {t('owner.venueDetails')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: isDark ? colors.navyLight : '#E8EAF0' }]}>
            <Ionicons name="football" size={48} color={isDark ? '#556080' : '#B0B5C5'} />
          </View>
        )}

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: tc.cardBg }]}>
          <Text style={[styles.venueName, { color: tc.textPrimary }]}>{venue.name}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={18} color={isDark ? '#8A94B0' : colors.navy} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{venue.playerCapacity}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{t('owner.players')}</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: tc.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="pricetag" size={18} color={isDark ? '#8A94B0' : colors.navy} />
              <Text style={[styles.statValue, { color: tc.textPrimary }]}>{typeNames}</Text>
              <Text style={[styles.statLabel, { color: tc.textSecondary }]}>{t('owner.type')}</Text>
            </View>
          </View>
        </View>

        {/* Availability */}
        {sortedAvailability.length > 0 && (
          <View style={[styles.section, { backgroundColor: tc.cardBg }]}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{t('owner.availability')}</Text>
            {sortedAvailability.map((avail) => (
              <View key={avail.id} style={[styles.availRow, { borderColor: tc.border }]}>
                <View style={styles.availDay}>
                  <Text style={[styles.dayText, { color: tc.textPrimary }]}>{t(dayTranslationKeys[avail.day])}</Text>
                  <View style={[styles.openBadge, {
                    backgroundColor: avail.isOpen ? 'rgba(0,193,106,0.1)' : 'rgba(255,68,68,0.1)',
                  }]}>
                    <Text style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: avail.isOpen ? '#00C16A' : '#FF4444',
                    }}>
                      {avail.isOpen ? t('owner.open') : t('owner.closed')}
                    </Text>
                  </View>
                </View>
                {avail.isOpen && avail.slots && avail.slots.length > 0 && (
                  <View style={styles.slotsWrap}>
                    {avail.slots.map((slot) => (
                      <View key={slot.id} style={[styles.slotChip, { backgroundColor: isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8' }]}>
                        <Text style={[styles.slotTime, { color: tc.textPrimary }]}>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </Text>
                        <Text style={[styles.slotPrice, { color: isDark ? '#8A94B0' : colors.navy }]}>
                          {formatPrice(slot.price)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
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
  venueName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
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
  availRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
  },
  availDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  slotsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginLeft: 4,
  },
  slotChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  slotPrice: {
    fontSize: 12,
    fontWeight: '700',
  },
});
