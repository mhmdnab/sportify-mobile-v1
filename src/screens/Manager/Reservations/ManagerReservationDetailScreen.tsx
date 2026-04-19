import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useManagerReservationsStore } from '../../../stores/manager-reservations.store';
import { spacing } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { ManagerReservationsStackParamList } from '../../../types/navigation';
import { ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

type RouteParams = RouteProp<ManagerReservationsStackParamList, 'ManagerReservationDetail'>;

const STATUS_META: Record<ReservationStatus, { color: string; icon: any; label: string; description: string }> = {
  [ReservationStatus.PENDING]: { color: '#F59E0B', icon: 'time-outline', label: 'Pending Approval', description: 'Waiting for venue confirmation.' },
  [ReservationStatus.CONFIRMED]: { color: '#10B981', icon: 'checkmark-circle-outline', label: 'Confirmed', description: 'Venue confirmed. Session is scheduled.' },
  [ReservationStatus.COACH_PENDING]: { color: '#F97316', icon: 'fitness-outline', label: 'Awaiting Coach', description: 'Venue confirmed. Waiting for the coach to accept.' },
  [ReservationStatus.COACH_REJECTED]: { color: '#EF4444', icon: 'close-circle-outline', label: 'Coach Declined', description: 'The coach has declined this booking.' },
  [ReservationStatus.CANCELLED]: { color: colors.error, icon: 'close-circle-outline', label: 'Cancelled', description: 'This booking was cancelled by the customer.' },
  [ReservationStatus.REJECTED]: { color: '#FF3B30', icon: 'ban-outline', label: 'Declined by Venue', description: 'You declined this booking request.' },
  [ReservationStatus.PLAYED]: { color: '#0EA5E9', icon: 'football-outline', label: 'Played', description: 'Session completed.' },
  [ReservationStatus.PAID]: { color: colors.textSecondary, icon: 'cash-outline', label: 'Paid', description: 'Payment recorded.' },
  [ReservationStatus.EXPIRED]: { color: '#9CA3AF', icon: 'alert-circle-outline', label: 'Expired', description: 'Booking expired — not confirmed before the slot time.' },
};

const statusActions: { from: ReservationStatus; to: ReservationStatus; label: string; icon: any; color: string }[] = [
  { from: ReservationStatus.PENDING, to: ReservationStatus.CONFIRMED, label: 'Confirm Booking', icon: 'checkmark-circle', color: '#10B981' },
  { from: ReservationStatus.CONFIRMED, to: ReservationStatus.PAID, label: 'Mark as Played', icon: 'football', color: '#0EA5E9' },
];

export function ManagerReservationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { reservationId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { currentReservation: reservation, isLoadingDetail, fetchReservationById, updateReservationStatus } = useManagerReservationsStore();
  const [updating, setUpdating] = useState(false);

  useEffect(() => { fetchReservationById(reservationId); }, [reservationId]);

  const handleStatusUpdate = async (status: ReservationStatus) => {
    setUpdating(true);
    try {
      await updateReservationStatus(reservationId, status);
      await fetchReservationById(reservationId);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update status');
    }
    setUpdating(false);
  };

  const handleDecline = () => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline this booking?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes, Decline', style: 'destructive', onPress: () => handleStatusUpdate(ReservationStatus.REJECTED) },
    ]);
  };

  if (isLoadingDetail || !reservation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const r = reservation;
  const meta = STATUS_META[r.status] ?? { color: colors.textHint, icon: 'ellipse-outline', label: r.status, description: '' };
  const cardBg = isDark ? '#0C1832' : '#FFFFFF';

  const additionalSlots = (r as any).additionalSlots ?? [];
  const isMultiSlot = additionalSlots.length > 0;
  const allSlots = [
    { id: r.slot?.id ?? 0, startTime: r.slot?.startTime ?? '', endTime: r.slot?.endTime ?? '', price: r.slot?.price ?? 0 },
    ...additionalSlots.map((e: any) => ({ id: e.slot.id, startTime: e.slot.startTime, endTime: e.slot.endTime, price: e.slot.price })),
  ];
  const totalVenue = allSlots.reduce((acc: number, s: any) => acc + s.price, 0);
  const totalDuration = allSlots.reduce((acc: number, s: any) => {
    if (!s.startTime || !s.endTime) return acc + 1;
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    return acc + ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  }, 0);
  const coachRate = (r as any).coachRate ?? (r as any).coach?.hourlyRate;
  const coachFee = (r as any).withCoach && coachRate ? coachRate * totalDuration : 0;
  const total = totalVenue + coachFee;

  const nextAction = statusActions.find((a) => a.from === r.status);
  const canDecline = r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED;
  const venueName = r.slot?.availability?.venue?.name || 'Venue';
  const userName = r.user?.name || 'Customer';
  const userEmail = r.user?.email || '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: cardBg }]}>
          <Ionicons name="arrow-back" size={20} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{isMultiSlot ? 'Group Booking' : 'Reservation'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Status Banner */}
        <View style={[styles.statusCard, { backgroundColor: `${meta.color}18` }]}>
          <View style={[styles.statusIconWrap, { backgroundColor: `${meta.color}22` }]}>
            <Ionicons name={meta.icon} size={24} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statusLabel, { color: meta.color }]}>{meta.label}</Text>
            <Text style={[styles.statusDesc, { color: meta.color, opacity: 0.8 }]}>{meta.description}</Text>
          </View>
        </View>

        {/* Customer */}
        <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
          <SectionHeader icon="person-outline" title="Customer" tc={tc} />
          <Row label="Name" value={userName} tc={tc} />
          <Row label="Email" value={userEmail || '—'} tc={tc} isLast />
        </View>

        {/* Booking Info */}
        <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
          <SectionHeader icon="calendar-outline" title="Booking Info" tc={tc} />
          <Row label="Booking ID" value={`#${r.id}`} tc={tc} />
          <Row label="Venue" value={venueName} tc={tc} />
          <Row label="Date" value={formatDate(r.slotDate)} tc={tc} />
          {isMultiSlot && <Row label="Slots" value={`${allSlots.length} time slots`} tc={tc} />}
          {(r as any).notes && <Row label="Notes" value={(r as any).notes} tc={tc} />}
          <Row label="Booked On" value={formatDate(r.createdAt)} tc={tc} isLast />
        </View>

        {/* Time Slots */}
        {isMultiSlot ? (
          <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
            <SectionHeader icon="time-outline" title="Time Slots" tc={tc} />
            {allSlots.map((s: any, idx: number) => (
              <View key={s.id} style={[styles.slotRow, idx < allSlots.length - 1 && { borderBottomWidth: 1, borderBottomColor: tc.border }]}>
                <View style={styles.slotLeft}>
                  <Ionicons name="time-outline" size={14} color={tc.textHint} />
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
        {(r as any).withCoach && (
          <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
            <SectionHeader icon="fitness-outline" title="Coach" tc={tc} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
            {(r as any).coach?.user?.name && <Row label="Coach" value={(r as any).coach.user.name} tc={tc} />}
            {coachRate && <Row label="Hourly Rate" value={`$${coachRate}/hr`} tc={tc} />}
            {r.status === ReservationStatus.COACH_PENDING && <Row label="Coach Status" value="Awaiting confirmation" tc={tc} valueColor={isDark ? '#A2B8FF' : '#0B1A3E'} />}
            {r.status === ReservationStatus.COACH_REJECTED && <Row label="Coach Status" value="Coach declined" tc={tc} valueColor={isDark ? '#A2B8FF' : '#0B1A3E'} />}
            <Row label="Session" value={`${totalDuration}h`} tc={tc} isLast />
          </View>
        )}

        {/* Cost Breakdown */}
        <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }]}>
          <SectionHeader icon="cash-outline" title="Cost Breakdown" tc={tc} />
          <Row label="Venue fee" value={formatPrice(totalVenue)} tc={tc} />
          {(r as any).withCoach && (
            <Row label={`Coach fee (${totalDuration}h × $${coachRate ?? 0})`} value={coachFee > 0 ? formatPrice(coachFee) : 'TBD'} tc={tc} valueColor={isDark ? '#A2B8FF' : '#0B1A3E'} />
          )}
          <View style={[styles.totalRow, { borderTopColor: tc.border }]}>
            <Text style={[styles.totalLabel, { color: tc.textPrimary }]}>Total</Text>
            <Text style={[styles.totalValue, { color: isDark ? '#A2B8FF' : colors.navy }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {nextAction && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: nextAction.color }]} onPress={() => handleStatusUpdate(nextAction.to)} disabled={updating} activeOpacity={0.85}>
              {updating ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name={nextAction.icon} size={18} color="#fff" />}
              <Text style={styles.actionBtnText}>{updating ? 'Updating…' : nextAction.label}</Text>
            </TouchableOpacity>
          )}
          {canDecline && (
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline} disabled={updating} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={18} color={colors.error} />
              <Text style={styles.declineBtnText}>{r.status === ReservationStatus.CONFIRMED ? 'Cancel Booking' : 'Decline Booking'}</Text>
            </TouchableOpacity>
          )}
        </View>

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

function Row({ label, value, tc, highlight, isLast, valueColor }: { label: string; value: string; tc: any; highlight?: boolean; isLast?: boolean; valueColor?: string }) {
  const rowIsDark = useThemeStore((s) => s.isDark);
  return (
    <View style={[rowStyles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: tc.border }]}>
      <Text style={[rowStyles.label, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[rowStyles.value, { color: valueColor ?? (highlight ? (rowIsDark ? '#A2B8FF' : colors.navy) : tc.textPrimary) }, (highlight || valueColor) && { fontWeight: '700' }]}>{value}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screenPadding, paddingVertical: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 }, android: { elevation: 2 } }) },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: spacing.screenPadding, paddingBottom: 20 },
  statusCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, borderRadius: 16, padding: 16, marginBottom: 14 },
  statusIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 15, fontWeight: '800', marginBottom: 3 },
  statusDesc: { fontSize: 13, fontWeight: '400', lineHeight: 18 },
  card: { borderRadius: 18, padding: 16, marginBottom: 14, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 2 } }) },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  slotLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotTime: { fontSize: 14 },
  slotPrice: { fontSize: 14, fontWeight: '600' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, marginTop: 4, borderTopWidth: 1 },
  totalLabel: { fontSize: 15, fontWeight: '700' },
  totalValue: { fontSize: 18, fontWeight: '800' },
  actions: { gap: 12, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14 },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  declineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(255,68,68,0.08)', borderRadius: 14, paddingVertical: 14 },
  declineBtnText: { color: colors.error, fontSize: 15, fontWeight: '700' },
});
