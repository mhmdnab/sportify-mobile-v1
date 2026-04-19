import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useCoachReservationsStore } from '../../../stores/coach-reservations.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { CoachBookingsStackParamList } from '../../../types/navigation';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';
import { colors } from '../../../theme/colors';

type Nav = NativeStackNavigationProp<CoachBookingsStackParamList, 'CoachBookingsList'>;

type FilterTab = ReservationStatus | 'all';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: ReservationStatus.COACH_PENDING, label: 'Pending' },
  { key: ReservationStatus.CONFIRMED, label: 'Confirmed' },
  { key: ReservationStatus.PAID, label: 'Paid' },
  { key: ReservationStatus.REJECTED, label: 'Rejected' },
  { key: ReservationStatus.COACH_REJECTED, label: 'Declined' },
  { key: ReservationStatus.EXPIRED, label: 'Expired' },
  { key: 'all', label: 'All' },
];

const STATUS_COLOR: Record<string, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: '#00C16A',
  [ReservationStatus.CANCELLED]: '#FF4444',
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
  [ReservationStatus.REJECTED]: '#FF4444',
  [ReservationStatus.COACH_PENDING]: '#FF9500',
  [ReservationStatus.COACH_REJECTED]: '#EF4444',
  [ReservationStatus.EXPIRED]: '#9CA3AF',
};

function statusLabel(s: ReservationStatus): string {
  switch (s) {
    case ReservationStatus.COACH_PENDING: return 'Awaiting You';
    case ReservationStatus.COACH_REJECTED: return 'Declined by You';
    case ReservationStatus.REJECTED: return 'Venue Declined';
    default: return s.replace('_', ' ');
  }
}

function ReservationCard({
  reservation,
  onPress,
  onAccept,
  onDecline,
  tc,
  isDark,
}: {
  reservation: Reservation;
  onPress: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  tc: any;
  isDark: boolean;
}) {
  const statusColor = STATUS_COLOR[reservation.status] ?? '#888';
  const venueName = reservation.slot?.availability?.venue?.name ?? 'Venue';
  const userName = reservation.user?.name ?? 'Client';
  const slotTime = reservation.slot
    ? `${formatTime(reservation.slot.startTime)} - ${formatTime(reservation.slot.endTime)}`
    : '';
  const slotPrice = reservation.slot?.price ?? 0;
  const coachFee = reservation.coachRate ?? 0;
  const total = slotPrice + coachFee;

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
            <Text style={[cardStyles.badgeText, { color: statusColor }]}>{statusLabel(reservation.status)}</Text>
          </View>
        </View>
        <Text style={[cardStyles.venue, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
        <View style={cardStyles.details}>
          <View style={cardStyles.detailRow}>
            <Ionicons name="calendar-outline" size={13} color={tc.textHint} />
            <Text style={[cardStyles.detailText, { color: tc.textSecondary }]}>{formatDate(reservation.slotDate)}</Text>
          </View>
          {slotTime ? (
            <View style={cardStyles.detailRow}>
              <Ionicons name="time-outline" size={13} color={tc.textHint} />
              <Text style={[cardStyles.detailText, { color: tc.textSecondary }]}>{slotTime}</Text>
            </View>
          ) : null}
          {total > 0 ? (
            <View style={cardStyles.detailRow}>
              <Ionicons name="cash-outline" size={13} color={tc.textHint} />
              <Text style={[cardStyles.priceText, { color: isDark ? '#A2B8FF' : colors.navy }]}>
                {formatPrice(slotPrice)} + {formatPrice(coachFee)} coach = {formatPrice(total)}
              </Text>
            </View>
          ) : null}
        </View>
        {reservation.status === ReservationStatus.COACH_PENDING && onAccept && onDecline && (
          <View style={cardStyles.actions}>
            <TouchableOpacity style={[cardStyles.actionBtn, cardStyles.acceptBtn]} onPress={onAccept}>
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={cardStyles.actionBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[cardStyles.actionBtn, cardStyles.declineBtn]} onPress={onDecline}>
              <Ionicons name="close" size={14} color="#fff" />
              <Text style={cardStyles.actionBtnText}>Decline</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: { flexDirection: 'row', borderRadius: radius.card, marginBottom: spacing.md, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  statusBar: { width: 4 },
  content: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  userName: { fontWeight: '600', fontSize: 14, flex: 1 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  venue: { fontSize: 13, marginBottom: 6 },
  details: { gap: 3 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailText: { fontSize: 12 },
  priceText: { fontSize: 12, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 8, marginTop: spacing.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, borderRadius: 10 },
  acceptBtn: { backgroundColor: '#00C16A' },
  declineBtn: { backgroundColor: '#FF4444' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});

export function CoachBookingsScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();
  const navigation = useNavigation<Nav>();
  const {
    reservations,
    isLoading,
    hasNext,
    statusFilter,
    fetchCoachReservations,
    fetchMore,
    acceptReservation,
    rejectReservation,
    setStatusFilter,
  } = useCoachReservationsStore();

  const [activeTab, setActiveTab] = React.useState<FilterTab>(ReservationStatus.COACH_PENDING);

  useFocusEffect(
    useCallback(() => {
      fetchCoachReservations(true);
    }, [statusFilter]),
  );

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setStatusFilter(tab === 'all' ? null : (tab as ReservationStatus));
    fetchCoachReservations(true);
  };

  const filtered = activeTab === 'all'
    ? reservations
    : reservations.filter((r) => r.status === activeTab);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>My Bookings</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, flexShrink: 0 }} contentContainerStyle={styles.tabBar}>
        {FILTER_TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                { backgroundColor: isDark ? 'rgba(162,184,255,0.07)' : 'rgba(11,26,62,0.08)' },
                active && { backgroundColor: isDark ? '#162B5C' : '#0B1A3E' },
              ]}
              onPress={() => handleTabChange(tab.key)}
            >
              <Text style={[styles.tabText, { color: active ? '#fff' : (isDark ? '#8A94B0' : '#0B1A3E') }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ReservationCard
            reservation={item}
            onPress={() => navigation.navigate('CoachBookingDetail', { reservationId: item.id })}
            onAccept={item.status === ReservationStatus.COACH_PENDING ? () => acceptReservation(item.id) : undefined}
            onDecline={item.status === ReservationStatus.COACH_PENDING ? () => rejectReservation(item.id) : undefined}
            tc={tc}
            isDark={isDark}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchCoachReservations(true)} tintColor="#0B1A3E" />}
        onEndReached={() => fetchMore()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textHint }]}>No bookings yet</Text>
            </View>
          ) : null
        }
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 4 },
  title: { fontSize: 22, fontWeight: '800' },
  tabBar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  tabActive: {},
  tabText: { fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: 40 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
