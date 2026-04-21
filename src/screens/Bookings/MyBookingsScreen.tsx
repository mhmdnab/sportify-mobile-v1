import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { spacing } from '../../theme/spacing';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useReservationsStore } from '../../stores/reservations.store';
import { useAuthStore } from '../../stores/auth.store';
import { Reservation, ReservationStatus } from '../../types/api';
import { ReservationCard } from './components/ReservationCard';
import { BookingsSkeleton } from './components/BookingsSkeleton';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { useThemeStore } from '../../stores/theme.store';
import { useTranslation } from 'react-i18next';
import { formatDate, formatTime } from '../../utils/date';
import { formatPrice } from '../../utils/currency';
import { radius } from '../../theme/spacing';

type Nav = { navigate: (screen: string, params?: any) => void };
type FilterKey = 'all' | ReservationStatus;

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: '#3B82F6',
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.REJECTED]: '#FF3B30',
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
  [ReservationStatus.COACH_PENDING]: '#F97316',
  [ReservationStatus.COACH_REJECTED]: '#EF4444',
  [ReservationStatus.EXPIRED]: '#9CA3AF',
};

const filterPills: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: ReservationStatus.PENDING, label: 'Pending' },
  { key: ReservationStatus.CONFIRMED, label: 'Confirmed' },
  { key: ReservationStatus.COACH_PENDING, label: 'Coach Pending' },
  { key: ReservationStatus.COACH_REJECTED, label: 'Coach Rejected' },
  { key: ReservationStatus.PAID, label: 'Paid' },
  { key: ReservationStatus.REJECTED, label: 'Rejected' },
  { key: ReservationStatus.EXPIRED, label: 'Expired' },
];

function ReservationItem({ reservation, onPress, tc }: { reservation: Reservation; onPress: () => void; tc: any }) {
  const isDark = useThemeStore((s) => s.isDark);
  const additionalSlots = reservation.additionalSlots ?? [];
  const isMultiSlot = additionalSlots.length > 0;

  if (!isMultiSlot) {
    return <ReservationCard reservation={reservation} onPress={onPress} />;
  }

  const statusColor = statusColors[reservation.status] || colors.textHint;
  const venueName = reservation.slot?.availability?.venue?.name || 'Venue';

  const allSlots = [
    { id: reservation.slot?.id ?? 0, startTime: reservation.slot?.startTime ?? '', endTime: reservation.slot?.endTime ?? '', price: reservation.slot?.price ?? 0 },
    ...additionalSlots.map((e) => ({ id: e.slot.id, startTime: e.slot.startTime, endTime: e.slot.endTime, price: e.slot.price })),
  ];
  const totalVenue = allSlots.reduce((acc, s) => acc + s.price, 0);
  const coachRate = reservation.coachRate ?? 0;
  const totalDuration = allSlots.reduce((acc, s) => {
    if (!s.startTime || !s.endTime) return acc + 1;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);
  const totalCoach = reservation.withCoach && coachRate ? coachRate * totalDuration : 0;
  const total = totalVenue + totalCoach;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.groupCard, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
    >
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.groupContent}>
        <View style={styles.groupHeader}>
          <Text style={[styles.groupVenue, { color: tc.textPrimary }]} numberOfLines={1}>
            {venueName}
          </Text>
          <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{reservation.status}</Text>
          </View>
        </View>

        <View style={[styles.slotCountPill, { backgroundColor: `${statusColor}12` }]}>
          <Ionicons name="layers-outline" size={13} color={statusColor} />
          <Text style={[styles.slotCountText, { color: statusColor }]}>
            {allSlots.length} slots · {formatDate(reservation.slotDate)}
          </Text>
        </View>

        <View style={styles.slotList}>
          {allSlots.map((s) => (
            <View key={s.id} style={styles.slotRow}>
              <Ionicons name="time-outline" size={12} color={tc.textHint} />
              <Text style={[styles.slotTime, { color: tc.textSecondary }]}>
                {s.startTime && s.endTime ? `${formatTime(s.startTime)} – ${formatTime(s.endTime)}` : '—'}
              </Text>
            </View>
          ))}
        </View>

        {total > 0 && (
          <View style={styles.priceRow}>
            <Ionicons name="cash-outline" size={13} color={tc.textHint} />
            <Text style={[styles.priceText, { color: isDark ? '#A2B8FF' : colors.navy }]}>
              {formatPrice(total)}{reservation.withCoach ? ' (with coach)' : ''}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={tc.textHint} />
    </TouchableOpacity>
  );
}

export function MyBookingsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { reservations, isLoading, error, fetchOwnReservations } = useReservationsStore();
  const user = useAuthStore((s) => s.user);
  const isCoach = !!user?.coach;
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const visiblePills = isCoach
    ? filterPills.filter((p) => p.key !== ReservationStatus.COACH_PENDING && p.key !== ReservationStatus.COACH_REJECTED)
    : filterPills;
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOwnReservations();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOwnReservations();
    setRefreshing(false);
  };

  const data: Reservation[] = activeFilter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === activeFilter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <Text style={[styles.title, { color: tc.textPrimary }]}>{t('bookings.myBookings')}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.pillRow}
      >
        {visiblePills.map((pill) => {
          const isActive = activeFilter === pill.key;
          const activeColor = pill.key !== 'all' ? statusColors[pill.key as ReservationStatus] : '#3B82F6';
          return (
            <TouchableOpacity
              key={pill.key}
              onPress={() => setActiveFilter(pill.key)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive
                    ? activeColor
                    : isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8',
                },
              ]}
            >
              <Text style={[styles.pillText, { color: isActive ? '#FFFFFF' : tc.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                {pill.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading && reservations.length === 0 ? (
        <BookingsSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOwnReservations} />
      ) : data.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={t('bookings.noUpcoming')}
          message={t('bookings.bookingsAppearHere')}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          renderItem={({ item }) => (
            <ReservationItem
              reservation={item}
              tc={tc}
              onPress={() => navigation.navigate('ReservationDetail', { reservationId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 24, fontWeight: '700',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md, paddingBottom: spacing.md,
  },
  pillScroll: { flexGrow: 0, flexShrink: 0, marginBottom: spacing.md },
  pillRow: { paddingHorizontal: spacing.screenPadding, gap: 8, alignItems: 'center' as const },
  pill: { height: 34, paddingHorizontal: 14, borderRadius: 17, alignItems: 'center' as const, justifyContent: 'center' as const },
  pillText: { fontSize: 13 },
  list: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },

  groupCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: radius.card, marginBottom: spacing.md,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, overflow: 'hidden',
  },
  statusBar: { width: 4, alignSelf: 'stretch' },
  groupContent: { flex: 1, padding: spacing.md },
  groupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  groupVenue: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  slotCountPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4, marginBottom: 8,
  },
  slotCountText: { fontSize: 12, fontWeight: '600' },
  slotList: { gap: 3, marginBottom: 6 },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  slotTime: { fontSize: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  priceText: { fontSize: 13, fontWeight: '600' },
});
