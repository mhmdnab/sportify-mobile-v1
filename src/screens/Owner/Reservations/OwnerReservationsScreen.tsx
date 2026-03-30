import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useOwnerReservationsStore } from '../../../stores/owner-reservations.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { OwnerReservationsStackParamList } from '../../../types/navigation';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

type Nav = NativeStackNavigationProp<OwnerReservationsStackParamList, 'OwnerReservationsList'>;

type FilterTab = 'all' | ReservationStatus;

const filterTabs: { key: FilterTab; labelKey: string }[] = [
  { key: 'all', labelKey: 'owner.all' },
  { key: ReservationStatus.PENDING, labelKey: 'owner.pending' },
  { key: ReservationStatus.CONFIRMED, labelKey: 'owner.confirmed' },
  { key: ReservationStatus.CANCELLED, labelKey: 'owner.cancelled' },
  { key: ReservationStatus.PLAYED, labelKey: 'owner.played' },
  { key: ReservationStatus.PAID, labelKey: 'owner.paid' },
];

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: colors.navy,
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
};

function OwnerReservationCard({
  reservation,
  onPress,
  tc,
}: {
  reservation: Reservation;
  onPress: () => void;
  tc: any;
}) {
  const statusColor = statusColors[reservation.status] || colors.textHint;
  const { t } = useTranslation();
  const venueName = reservation.slot?.availability?.venue?.name || t('owner.venue');
  const userName = reservation.user?.name || t('owner.user');
  const slotTime = reservation.slot
    ? `${formatTime(reservation.slot.startTime)} - ${formatTime(reservation.slot.endTime)}`
    : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[cardStyles.container, { backgroundColor: tc.cardBg }]}
    >
      <View style={[cardStyles.statusBar, { backgroundColor: statusColor }]} />
      <View style={cardStyles.content}>
        <View style={cardStyles.topRow}>
          <View style={cardStyles.userInfo}>
            <View style={[cardStyles.avatar, { backgroundColor: `${statusColor}20` }]}>
              <Ionicons name="person" size={14} color={statusColor} />
            </View>
            <Text style={[cardStyles.userName, { color: tc.textPrimary }]} numberOfLines={1}>
              {userName}
            </Text>
          </View>
          <View style={[cardStyles.badge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[cardStyles.badgeText, { color: statusColor }]}>
              {reservation.status}
            </Text>
          </View>
        </View>

        <Text style={[cardStyles.venue, { color: tc.textSecondary }]} numberOfLines={1}>
          {venueName}
        </Text>

        <View style={cardStyles.details}>
          <View style={cardStyles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={tc.textHint} />
            <Text style={[cardStyles.detailText, { color: tc.textSecondary }]}>
              {formatDate(reservation.slotDate)}
            </Text>
          </View>
          {slotTime ? (
            <View style={cardStyles.detailRow}>
              <Ionicons name="time-outline" size={13} color={tc.textHint} />
              <Text style={[cardStyles.detailText, { color: tc.textSecondary }]}>{slotTime}</Text>
            </View>
          ) : null}
          {reservation.slot?.price ? (
            <View style={cardStyles.detailRow}>
              <Ionicons name="cash-outline" size={13} color={tc.textHint} />
              <Text style={[cardStyles.priceText, { color: colors.navy }]}>
                {formatPrice(reservation.slot.price)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.card,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  statusBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  venue: {
    fontSize: 13,
    marginBottom: 6,
  },
  details: {
    gap: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export function OwnerReservationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { reservations, isLoading, fetchOwnerReservations, fetchMore, hasNext } =
    useOwnerReservationsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  useEffect(() => {
    fetchOwnerReservations();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOwnerReservations();
    setRefreshing(false);
  }, []);

  const filtered =
    activeFilter === 'all'
      ? reservations
      : reservations.filter((r) => r.status === activeFilter);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>{t('owner.reservations')}</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {filterTabs.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setActiveFilter(item.key)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive
                    ? (isDark ? colors.navyLight : colors.navy)
                    : (isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8'),
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: isActive ? '#FFFFFF' : tc.textSecondary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {t(item.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <OwnerReservationCard
            reservation={item}
            tc={tc}
            onPress={() => navigation.navigate('OwnerReservationDetail', { reservationId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNext && fetchMore()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>{t('owner.noReservations')}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  filterRow: {
    paddingHorizontal: spacing.screenPadding,
    gap: 8,
    marginBottom: spacing.md,
  },
  filterChip: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  filterText: {
    fontSize: 13,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
