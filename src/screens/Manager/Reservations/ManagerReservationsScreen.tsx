import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useManagerReservationsStore } from '../../../stores/manager-reservations.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { ManagerReservationsStackParamList } from '../../../types/navigation';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

type Nav = NativeStackNavigationProp<ManagerReservationsStackParamList, 'ManagerReservationsList'>;

type FilterTab = 'all' | ReservationStatus;

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: ReservationStatus.PENDING, label: 'Pending' },
  { key: ReservationStatus.CONFIRMED, label: 'Confirmed' },
  { key: ReservationStatus.REJECTED, label: 'Rejected' },
  { key: ReservationStatus.PAID, label: 'Paid' },
  { key: 'all', label: 'All' },
];

const TODAY_ONLY_FILTERS: FilterTab[] = [ReservationStatus.PAID];

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: '#3B82F6',
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
  [ReservationStatus.REJECTED]: colors.error,
  [ReservationStatus.COACH_PENDING]: '#F97316',
  [ReservationStatus.COACH_REJECTED]: '#EF4444',
  [ReservationStatus.EXPIRED]: '#9CA3AF',
};

function ReservationCard({ reservation, onPress, tc }: { reservation: Reservation; onPress: () => void; tc: any }) {
  const statusColor = statusColors[reservation.status] || colors.textHint;
  const { t } = useTranslation();
  const venueName = reservation.slot?.availability?.venue?.name || t('owner.venue');
  const userName = reservation.user?.name || t('owner.user');
  const slotTime = reservation.slot ? `${formatTime(reservation.slot.startTime)} - ${formatTime(reservation.slot.endTime)}` : '';

  const venuePrice = reservation.slot?.price ?? 0;
  const slotDurationHours = (() => {
    if (!reservation.slot?.startTime || !reservation.slot?.endTime) return 1;
    const [sh, sm] = (reservation.slot.startTime as string).split(':').map(Number);
    const [eh, em] = (reservation.slot.endTime as string).split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  })();
  const coachFee = (reservation as any).withCoach && (reservation as any).coachRate
    ? (reservation as any).coachRate * slotDurationHours : 0;
  const total = venuePrice + coachFee;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[cardStyles.container, { backgroundColor: tc.cardBg }]}>
      <View style={[cardStyles.statusBar, { backgroundColor: statusColor }]} />
      <View style={cardStyles.content}>
        <View style={cardStyles.topRow}>
          <View style={cardStyles.userInfo}>
            <View style={[cardStyles.avatar, { backgroundColor: `${statusColor}20` }]}>
              <FontAwesome6 name="people-group" size={12} color={statusColor} />
            </View>
            <Text style={[cardStyles.userName, { color: tc.textPrimary }]} numberOfLines={1}>{userName}</Text>
          </View>
          <View style={[cardStyles.badge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[cardStyles.badgeText, { color: statusColor }]}>{reservation.status}</Text>
          </View>
        </View>
        <Text style={[cardStyles.venue, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
        <View style={cardStyles.details}>
          <View style={cardStyles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={tc.textHint} />
            <Text style={[cardStyles.detailText, { color: tc.textSecondary }]}>{formatDate(reservation.slotDate)}</Text>
          </View>
          {slotTime ? <View style={cardStyles.detailRow}><Ionicons name="time-outline" size={13} color={tc.textHint} /><Text style={[cardStyles.detailText, { color: tc.textSecondary }]}>{slotTime}</Text></View> : null}
          {total > 0 ? <View style={cardStyles.detailRow}><Ionicons name="cash-outline" size={13} color={tc.textHint} /><Text style={[cardStyles.priceText, { color: '#3B82F6' }]}>{formatPrice(total)}{(reservation as any).withCoach ? ' (with coach)' : ''}</Text></View> : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function slotDur(r: Reservation): number {
  if (!r.slot?.startTime || !r.slot?.endTime) return 1;
  const [sh, sm] = (r.slot.startTime as string).split(':').map(Number);
  const [eh, em] = (r.slot.endTime as string).split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

interface GroupEntry { key: string; groupId?: string; reservations: Reservation[] }

function groupReservations(list: Reservation[]): GroupEntry[] {
  const result: GroupEntry[] = [];
  const seen = new Set<string>();
  for (const r of list) {
    const gId = (r as any).groupId as string | undefined;
    if (gId) {
      if (seen.has(gId)) continue;
      seen.add(gId);
      result.push({ key: `group-${gId}`, groupId: gId, reservations: list.filter((x) => (x as any).groupId === gId) });
    } else {
      result.push({ key: `single-${r.id}`, reservations: [r] });
    }
  }
  return result;
}

function GroupCard({ entry, onPress, tc }: { entry: GroupEntry; onPress: () => void; tc: any }) {
  const { t } = useTranslation();
  if (entry.reservations.length === 1) {
    return <ReservationCard reservation={entry.reservations[0]} onPress={onPress} tc={tc} />;
  }
  const first = entry.reservations[0];
  const statusColor = statusColors[first.status] || colors.textHint;
  const userName = first.user?.name || t('owner.user');
  const venueName = first.slot?.availability?.venue?.name || t('owner.venue');
  const totalVenue = entry.reservations.reduce((acc, r) => acc + (r.slot?.price ?? 0), 0);
  const totalCoach = entry.reservations.reduce((acc, r) => {
    return acc + ((r as any).withCoach && (r as any).coachRate ? (r as any).coachRate * slotDur(r) : 0);
  }, 0);
  const total = totalVenue + totalCoach;
  const withCoach = entry.reservations.some((r) => (r as any).withCoach);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[cardStyles.container, { backgroundColor: tc.cardBg }]}>
      <View style={[cardStyles.statusBar, { backgroundColor: statusColor }]} />
      <View style={cardStyles.content}>
        <View style={cardStyles.topRow}>
          <View style={cardStyles.userInfo}>
            <View style={[cardStyles.avatar, { backgroundColor: `${statusColor}20` }]}>
              <FontAwesome6 name="people-group" size={12} color={statusColor} />
            </View>
            <Text style={[cardStyles.userName, { color: tc.textPrimary }]} numberOfLines={1}>{userName}</Text>
          </View>
          <View style={[cardStyles.badge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[cardStyles.badgeText, { color: statusColor }]}>{first.status}</Text>
          </View>
        </View>
        <Text style={[cardStyles.venue, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
        <View style={cardStyles.details}>
          <View style={cardStyles.detailRow}>
            <Ionicons name="layers-outline" size={13} color={statusColor} />
            <Text style={[cardStyles.detailText, { color: statusColor, fontWeight: '600' }]}>
              {entry.reservations.length} slots · {formatDate(first.slotDate)}
            </Text>
          </View>
          {entry.reservations.map((r) => (
            <View key={r.id} style={cardStyles.detailRow}>
              <Ionicons name="time-outline" size={12} color={tc.textHint} />
              <Text style={[cardStyles.detailText, { color: tc.textSecondary }]}>
                {r.slot ? `${formatTime(r.slot.startTime)} – ${formatTime(r.slot.endTime)}` : ''}
              </Text>
            </View>
          ))}
          {total > 0 && (
            <View style={cardStyles.detailRow}>
              <Ionicons name="cash-outline" size={13} color={tc.textHint} />
              <Text style={[cardStyles.priceText, { color: '#3B82F6' }]}>{formatPrice(total)}{withCoach ? ' (with coach)' : ''}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: radius.card, marginBottom: spacing.md, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statusBar: { width: 4 },
  content: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  userName: { fontSize: 15, fontWeight: '600', flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  venue: { fontSize: 13, marginBottom: 6 },
  details: { gap: 3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 12 },
  priceText: { fontSize: 12, fontWeight: '600' },
});

export function ManagerReservationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { reservations, isLoading, fetchManagerReservations, fetchMore, hasNext, pendingFilter, setPendingFilter } = useManagerReservationsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>(ReservationStatus.PENDING);

  useEffect(() => { fetchManagerReservations(); }, []);

  useFocusEffect(useCallback(() => {
    if (pendingFilter) {
      setActiveFilter(pendingFilter as FilterTab);
      setPendingFilter(null);
    }
  }, [pendingFilter]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchManagerReservations();
    setRefreshing(false);
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const filtered = reservations
    .filter((r) => activeFilter === 'all' || r.status === activeFilter)
    .filter((r) => {
      if (TODAY_ONLY_FILTERS.includes(activeFilter)) return r.slotDate?.startsWith(today);
      return true;
    });
  const grouped = groupReservations(filtered);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>{t('owner.reservations')}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {filterTabs.map((item) => {
          const isActive = activeFilter === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => setActiveFilter(item.key)}
              style={[styles.filterChip, { backgroundColor: isActive ? (isDark ? colors.navyLight : colors.navy) : (isDark ? 'rgba(150,170,220,0.08)' : '#F0F2F8') }]}
            >
              <Text style={[styles.filterText, { color: isActive ? '#FFFFFF' : tc.textSecondary, fontWeight: isActive ? '700' : '500' }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={grouped}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <GroupCard
            entry={item}
            tc={tc}
            onPress={() => navigation.navigate('ManagerReservationDetail', {
              reservationId: item.reservations[0].id,
            })}
          />
        )}
        style={styles.flatList}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNext && fetchMore()}
        onEndReachedThreshold={0.3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />}
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
  header: { paddingHorizontal: spacing.screenPadding, paddingVertical: spacing.md },
  title: { fontSize: 24, fontWeight: '800' },
  filterScroll: { flexGrow: 0, flexShrink: 0, marginBottom: spacing.md },
  filterRow: { paddingHorizontal: spacing.screenPadding, gap: 8, alignItems: 'center' as const },
  filterChip: { height: 36, paddingHorizontal: 16, borderRadius: 18, alignItems: 'center' as const, justifyContent: 'center' as const },
  filterText: { fontSize: 13 },
  flatList: { flex: 1 },
  list: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '500' },
});
