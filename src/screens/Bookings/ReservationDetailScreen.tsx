import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { spacing } from '../../theme/spacing';
import { useReservationsStore } from '../../stores/reservations.store';
import { ReservationStatus } from '../../types/api';
import { formatDate, formatTime } from '../../utils/date';
import { formatPrice } from '../../utils/currency';
import { BookingsStackParamList } from '../../types/navigation';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { useThemeStore } from '../../stores/theme.store';

type Props = NativeStackScreenProps<BookingsStackParamList, 'ReservationDetail'>;

const STATUS_META: Record<ReservationStatus, { color: string; icon: any; label: string; description: string }> = {
  [ReservationStatus.PENDING]: {
    color: '#F59E0B', icon: 'time-outline',
    label: 'Pending Approval', description: 'Your booking is waiting for venue confirmation.',
  },
  [ReservationStatus.CONFIRMED]: {
    color: '#10B981', icon: 'checkmark-circle-outline',
    label: 'Confirmed', description: 'Your booking has been confirmed by the venue.',
  },
  [ReservationStatus.COACH_PENDING]: {
    color: '#0B1A3E', icon: 'fitness-outline',
    label: 'Awaiting Coach', description: 'Venue confirmed. Waiting for the coach to accept.',
  },
  [ReservationStatus.COACH_REJECTED]: {
    color: '#0B1A3E', icon: 'close-circle-outline',
    label: 'Coach Declined', description: 'The coach has declined this booking.',
  },
  [ReservationStatus.CANCELLED]: {
    color: colors.error, icon: 'close-circle-outline',
    label: 'Cancelled', description: 'This booking has been cancelled.',
  },
  [ReservationStatus.REJECTED]: {
    color: '#FF3B30', icon: 'ban-outline',
    label: 'Declined by Venue', description: 'The venue has declined this booking request.',
  },
  [ReservationStatus.PLAYED]: {
    color: '#0EA5E9', icon: 'football-outline',
    label: 'Played', description: 'This session has been completed.',
  },
  [ReservationStatus.PAID]: {
    color: colors.textSecondary, icon: 'cash-outline',
    label: 'Paid', description: 'Payment has been recorded.',
  },
};

function parseDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

export function ReservationDetailScreen({ route, navigation }: Props) {
  const { reservationId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { currentReservation, isLoading, error, fetchReservationById, cancelReservation } = useReservationsStore();

  useEffect(() => {
    fetchReservationById(reservationId);
  }, [reservationId]);

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel', style: 'destructive',
        onPress: async () => { try { await cancelReservation(reservationId); } catch {} },
      },
    ]);
  };

  if (isLoading && !currentReservation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentReservation) {
    return (
      <ErrorState
        message={error || 'Booking not found'}
        onRetry={() => fetchReservationById(reservationId)}
      />
    );
  }

  const r = currentReservation;
  const cardBg = isDark ? '#0C1832' : '#FFFFFF';
  const meta = STATUS_META[r.status] ?? { color: colors.textHint, icon: 'ellipse-outline', label: r.status, description: '' };
  const canCancel = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.COACH_PENDING].includes(r.status);
  const venueName = r.slot?.availability?.venue?.name || 'Venue';

  const additionalSlots = r.additionalSlots ?? [];
  const isMultiSlot = additionalSlots.length > 0;

  // Build a flat list of all slots: primary + additional
  const allSlots = [
    { id: r.slot?.id ?? 0, startTime: r.slot?.startTime ?? '', endTime: r.slot?.endTime ?? '', price: r.slot?.price ?? 0 },
    ...additionalSlots.map((entry) => ({
      id: entry.slot.id,
      startTime: entry.slot.startTime,
      endTime: entry.slot.endTime,
      price: entry.slot.price,
    })),
  ];

  const totalVenue = allSlots.reduce((acc, s) => acc + s.price, 0);
  const totalDuration = allSlots.reduce((acc, s) => acc + (s.startTime && s.endTime ? parseDuration(s.startTime, s.endTime) : 1), 0);
  const coachFee = r.withCoach && r.coachRate ? r.coachRate * totalDuration : 0;
  const total = totalVenue + coachFee;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('MyBookings')} style={[styles.backBtn, { backgroundColor: cardBg }]}>
          <Ionicons name="arrow-back" size={20} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Booking Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Status */}
        <View style={[styles.statusCard, { backgroundColor: `${meta.color}18` }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: `${meta.color}22` }]}>
            <Ionicons name={meta.icon} size={24} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[styles.statusDesc, { color: meta.color, opacity: 0.8 }]}>{meta.description}</Text>
          </View>
        </View>

        {/* Booking Info */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SectionHeader icon="calendar-outline" title="Booking Info" tc={tc} />
          <Row label="Booking ID" value={`#${r.id}`} tc={tc} />
          <Row label="Venue" value={venueName} tc={tc} />
          <Row label="Date" value={formatDate(r.slotDate)} tc={tc} />
          {isMultiSlot && <Row label="Slots" value={`${allSlots.length} time slots`} tc={tc} />}
          {r.notes && <Row label="Notes" value={r.notes} tc={tc} />}
          <Row label="Booked On" value={formatDate(r.createdAt)} tc={tc} isLast />
        </View>

        {/* Time Slots (multi) or single time row */}
        {isMultiSlot ? (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <SectionHeader icon="time-outline" title="Time Slots" tc={tc} />
            {allSlots.map((s, idx) => (
              <View
                key={s.id}
                style={[styles.slotItem, idx < allSlots.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.border }]}
              >
                <View style={styles.slotLeft}>
                  <Ionicons name="time-outline" size={13} color={tc.textHint} />
                  <Text style={[styles.slotTime, { color: tc.textPrimary }]}>
                    {s.startTime && s.endTime ? `${formatTime(s.startTime)} – ${formatTime(s.endTime)}` : '—'}
                  </Text>
                </View>
                <Text style={[styles.slotPrice, { color: colors.navy }]}>{formatPrice(s.price)}</Text>
              </View>
            ))}
          </View>
        ) : (
          r.slot && (
            <View style={[styles.card, { backgroundColor: cardBg }]}>
              <SectionHeader icon="time-outline" title="Time" tc={tc} />
              <Row label="Slot" value={`${formatTime(r.slot.startTime)} – ${formatTime(r.slot.endTime)}`} tc={tc} isLast />
            </View>
          )
        )}

        {/* Coach */}
        {r.withCoach && (
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <SectionHeader icon="fitness-outline" title="Coach" tc={tc} color="#0B1A3E" />
            {r.coach?.user?.name && <Row label="Coach" value={r.coach.user.name} tc={tc} />}
            {r.coachRate && <Row label="Hourly Rate" value={`$${r.coachRate}/hr`} tc={tc} />}
            {r.status === ReservationStatus.COACH_PENDING && <Row label="Status" value="Awaiting confirmation" tc={tc} valueColor="#0B1A3E" />}
            {r.status === ReservationStatus.COACH_REJECTED && <Row label="Status" value="Coach declined" tc={tc} valueColor="#0B1A3E" />}
            <Row label="Session Duration" value={`${totalDuration}h`} tc={tc} isLast />
          </View>
        )}

        {/* Cost Breakdown */}
        <View style={[styles.card, { backgroundColor: cardBg }]}>
          <SectionHeader icon="cash-outline" title="Cost Breakdown" tc={tc} />
          <Row label="Venue fee" value={formatPrice(totalVenue)} tc={tc} />
          {r.withCoach && (
            <Row
              label={`Coach fee (${totalDuration}h × $${r.coachRate ?? 0})`}
              value={coachFee > 0 ? formatPrice(coachFee) : 'TBD'}
              tc={tc} valueColor="#0B1A3E"
            />
          )}
          <View style={[styles.totalRow, { borderTopColor: tc.border }]}>
            <Text style={[styles.totalLabel, { color: tc.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.navy }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <Text style={styles.cancelBtnText}>{isMultiSlot ? 'Cancel All Slots' : 'Cancel Booking'}</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title, tc, color }: { icon: any; title: string; tc: any; color?: string }) {
  return (
    <View style={sectionHeaderStyles.row}>
      <Ionicons name={icon} size={16} color={color ?? tc.textHint} />
      <Text style={[sectionHeaderStyles.title, { color: tc.textSecondary }]}>{title}</Text>
    </View>
  );
}
const sectionHeaderStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  title: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
});

function Row({ label, value, tc, highlight, isLast, valueColor }: {
  label: string; value: string; tc: any; highlight?: boolean; isLast?: boolean; valueColor?: string;
}) {
  return (
    <View style={[rowStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: tc.border }]}>
      <Text style={[rowStyles.label, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: valueColor ?? (highlight ? colors.navy : tc.textPrimary) }, (highlight || valueColor) && { fontWeight: '700' }]}>
        {value}
      </Text>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '500', maxWidth: '58%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: spacing.screenPadding, paddingBottom: 20 },
  statusCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    borderRadius: 16, padding: 16, marginBottom: 14,
  },
  statusIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  statusDesc: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  card: {
    borderRadius: 18, padding: 16, marginBottom: 14,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  slotItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  slotLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotTime: { fontSize: 14 },
  slotPrice: { fontSize: 14, fontWeight: '600' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12, marginTop: 4, borderTopWidth: 1,
  },
  totalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  cancelBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(255,68,68,0.08)', borderRadius: 14, paddingVertical: 14,
  },
  cancelBtnText: { color: colors.error, fontSize: 15, fontWeight: '700' },
});
