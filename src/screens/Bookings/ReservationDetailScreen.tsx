import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
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
  [ReservationStatus.EXPIRED]: {
    color: '#9CA3AF', icon: 'alert-circle-outline',
    label: 'Expired', description: 'This booking was not confirmed in time.',
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
  const { currentReservation, isLoading, error, fetchReservationById } = useReservationsStore();

  useEffect(() => {
    fetchReservationById(reservationId);
  }, [reservationId]);

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
        <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
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
          <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
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
                <Text style={[styles.slotPrice, { color: isDark ? '#A2B8FF' : colors.navy }]}>{formatPrice(s.price)}</Text>
              </View>
            ))}
          </View>
        ) : (
          r.slot && (
            <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
              <SectionHeader icon="time-outline" title="Time" tc={tc} />
              <Row label="Slot" value={`${formatTime(r.slot.startTime)} – ${formatTime(r.slot.endTime)}`} tc={tc} isLast />
            </View>
          )
        )}

        {/* Coach */}
        {r.withCoach && (
          <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
            <SectionHeader icon="fitness-outline" title="Coach" tc={tc} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
            {r.coach?.user?.name && <Row label="Coach" value={r.coach.user.name} tc={tc} />}
            {r.coachRate && <Row label="Hourly Rate" value={`$${r.coachRate}/hr`} tc={tc} />}
            {r.status === ReservationStatus.COACH_PENDING && <Row label="Status" value="Awaiting confirmation" tc={tc} valueColor={isDark ? '#A2B8FF' : '#0B1A3E'} />}
            {r.status === ReservationStatus.COACH_REJECTED && <Row label="Status" value="Coach declined" tc={tc} valueColor={isDark ? '#A2B8FF' : '#0B1A3E'} />}
            <Row label="Session Duration" value={`${totalDuration}h`} tc={tc} isLast />
          </View>
        )}

        {/* Cost Breakdown */}
        <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
          <SectionHeader icon="cash-outline" title="Cost Breakdown" tc={tc} />
          <Row label="Venue fee" value={formatPrice(totalVenue)} tc={tc} />
          {r.withCoach && (
            <Row
              label={`Coach fee (${totalDuration}h × $${r.coachRate ?? 0})`}
              value={coachFee > 0 ? formatPrice(coachFee) : 'TBD'}
              tc={tc} valueColor={isDark ? '#A2B8FF' : '#0B1A3E'}
            />
          )}
          <View style={[styles.totalRow, { borderTopColor: tc.border }]}>
            <Text style={[styles.totalLabel, { color: tc.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: isDark ? '#A2B8FF' : colors.navy }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        {canCancel && (
          <CancelContactCard r={r} tc={tc} isDark={isDark} />
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function CancelContactCard({ r, tc, isDark }: { r: any; tc: any; isDark: boolean }) {
  const branchPhone = r.slot?.availability?.venue?.branch?.phone;
  const coachPhone = r.coach?.user?.phone ?? r.coach?.user?.email;
  const hasCoach = !!(r as any).withCoach;

  return (
    <View style={[cancelCardStyles.wrap, isDark && { borderColor: 'rgba(245,158,11,0.2)' }]}>
      <View style={cancelCardStyles.titleRow}>
        <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
        <Text style={cancelCardStyles.title}>Want to cancel?</Text>
      </View>
      <Text style={[cancelCardStyles.body, { color: tc.textSecondary }]}>
        To cancel this booking, please contact the venue directly.
      </Text>
      {branchPhone && (
        <TouchableOpacity style={cancelCardStyles.contactRow} onPress={() => Linking.openURL(`tel:${branchPhone}`)}>
          <Ionicons name="call-outline" size={15} color="#F59E0B" />
          <Text style={cancelCardStyles.contactText}>{branchPhone}</Text>
          <Ionicons name="arrow-forward-outline" size={13} color="#F59E0B" />
        </TouchableOpacity>
      )}
      {hasCoach && coachPhone && (
        <>
          <Text style={[cancelCardStyles.body, { color: tc.textSecondary, marginTop: 8 }]}>
            This booking includes a coach. You may also contact them:
          </Text>
          <TouchableOpacity
            style={cancelCardStyles.contactRow}
            onPress={() => Linking.openURL(coachPhone.includes('@') ? `mailto:${coachPhone}` : `tel:${coachPhone}`)}
          >
            <Ionicons name={coachPhone.includes('@') ? 'mail-outline' : 'call-outline'} size={15} color="#A2B8FF" />
            <Text style={[cancelCardStyles.contactText, { color: '#A2B8FF' }]}>{coachPhone}</Text>
            <Ionicons name="arrow-forward-outline" size={13} color="#A2B8FF" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
const cancelCardStyles = StyleSheet.create({
  wrap: {
    borderRadius: 16, padding: 16, marginBottom: 14,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.15)',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  body: { fontSize: 13, lineHeight: 18 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  contactText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#F59E0B' },
});

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
});
