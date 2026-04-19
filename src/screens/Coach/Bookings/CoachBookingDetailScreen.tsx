import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useCoachReservationsStore } from '../../../stores/coach-reservations.store';
import { spacing } from '../../../theme/spacing';
import { CoachBookingsStackParamList } from '../../../types/navigation';
import { ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';
import { colors } from '../../../theme/colors';

type Route = RouteProp<CoachBookingsStackParamList, 'CoachBookingDetail'>;

const STATUS_COLOR: Record<string, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: '#00C16A',
  [ReservationStatus.CANCELLED]: '#FF4444',
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
  [ReservationStatus.REJECTED]: '#FF4444',
  [ReservationStatus.COACH_PENDING]: '#FF9500',
  [ReservationStatus.COACH_REJECTED]: '#EF4444',
};

function statusLabel(s: ReservationStatus): string {
  switch (s) {
    case ReservationStatus.COACH_PENDING: return 'Awaiting Your Approval';
    case ReservationStatus.COACH_REJECTED: return 'Declined by You';
    case ReservationStatus.REJECTED: return 'Declined by Venue';
    default: return s.replace('_', ' ');
  }
}

function InfoRow({ icon, label, value, tc }: { icon: string; label: string; value: string; tc: any }) {
  const isDarkRow = useThemeStore((s) => s.isDark);
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconBox, { backgroundColor: isDarkRow ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.1)' }]}>
        <Ionicons name={icon as any} size={16} color={isDarkRow ? '#A2B8FF' : '#0B1A3E'} />
      </View>
      <View style={rowStyles.texts}>
        <Text style={[rowStyles.label, { color: tc.textHint }]}>{label}</Text>
        <Text style={[rowStyles.value, { color: tc.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}
const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  iconBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  label: { fontSize: 11, fontWeight: '500' },
  value: { fontSize: 15, fontWeight: '600', marginTop: 1 },
});

export function CoachBookingDetailScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { reservationId } = route.params;

  const { currentReservation, isLoadingDetail, fetchReservationById, acceptReservation, rejectReservation, markAsPaid } =
    useCoachReservationsStore();

  useEffect(() => {
    fetchReservationById(reservationId);
  }, [reservationId]);

  const handleAccept = () => {
    Alert.alert('Accept Booking', 'Are you sure you want to accept this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Accept',
        onPress: async () => {
          await acceptReservation(reservationId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleDecline = () => {
    Alert.alert('Decline Booking', 'Are you sure you want to decline this booking?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: async () => {
          await rejectReservation(reservationId);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleMarkAsPaid = () => {
    Alert.alert('Mark as Paid', 'Confirm that this booking has been paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark as Paid',
        onPress: async () => {
          await markAsPaid(reservationId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (isLoadingDetail || !currentReservation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={isDark ? '#A2B8FF' : '#0B1A3E'} />
      </SafeAreaView>
    );
  }

  const r = currentReservation;
  const statusColor = STATUS_COLOR[r.status] ?? '#888';
  const slotPrice = r.slot?.price ?? 0;
  const slotDurationHours = (() => {
    if (!r.slot?.startTime || !r.slot?.endTime) return 1;
    const [sh, sm] = (r.slot.startTime as string).split(':').map(Number);
    const [eh, em] = (r.slot.endTime as string).split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  })();
  const coachRate = (r as any).coachRate ?? 0;
  const coachFee = coachRate * slotDurationHours;
  const total = slotPrice + coachFee;
  const venueName = r.slot?.availability?.venue?.name ?? '—';
  const branchPhone = (r as any).slot?.availability?.venue?.branch?.phone as string | undefined;
  const userName = r.user?.name ?? '—';
  const coachName = (r as any).coach?.user?.name;
  const canCancel = r.status === ReservationStatus.CONFIRMED || r.status === ReservationStatus.COACH_PENDING;
  const slotStart = r.slot?.startTime ? formatTime(r.slot.startTime) : '—';
  const slotEnd = r.slot?.endTime ? formatTime(r.slot.endTime) : '—';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Booking Detail</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15`, borderColor: `${statusColor}30` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel(r.status as ReservationStatus)}</Text>
        </View>

        {/* Details card */}
        <View style={[styles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <InfoRow icon="person-outline" label="Client" value={userName} tc={tc} />
          {coachName ? (
            <>
              <View style={styles.divider} />
              <InfoRow icon="fitness-outline" label="Coach" value={coachName} tc={tc} />
            </>
          ) : null}
          <View style={styles.divider} />
          <InfoRow icon="location-outline" label="Venue" value={venueName} tc={tc} />
          <View style={styles.divider} />
          <InfoRow icon="calendar-outline" label="Date" value={formatDate(r.slotDate)} tc={tc} />
          <View style={styles.divider} />
          <InfoRow icon="time-outline" label="Time" value={`${slotStart} – ${slotEnd}`} tc={tc} />
          {r.notes ? (
            <>
              <View style={styles.divider} />
              <InfoRow icon="document-text-outline" label="Notes" value={r.notes} tc={tc} />
            </>
          ) : null}
        </View>

        {/* Price breakdown */}
        <View style={[styles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>Price Breakdown</Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: tc.textSecondary }]}>Slot</Text>
            <Text style={[styles.priceValue, { color: tc.textPrimary }]}>{formatPrice(slotPrice)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: tc.textSecondary }]}>{`Coach fee (${slotDurationHours}h × $${coachRate})`}</Text>
            <Text style={[styles.priceValue, { color: isDark ? '#A2B8FF' : '#0B1A3E' }]}>{coachFee > 0 ? formatPrice(coachFee) : 'TBD'}</Text>
          </View>
          <View style={[styles.divider, { marginVertical: 6 }]} />
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: tc.textPrimary, fontWeight: '700' }]}>Total</Text>
            <Text style={[styles.priceValue, { color: isDark ? '#A2B8FF' : colors.navy, fontWeight: '800', fontSize: 18 }]}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Cancel contact card */}
        {canCancel && (
          <View style={[styles.contactCard, { borderColor: 'rgba(245,158,11,0.2)', backgroundColor: 'rgba(245,158,11,0.07)' }]}>
            <View style={styles.contactCardHeader}>
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text style={styles.contactCardTitle}>Need to cancel?</Text>
            </View>
            <Text style={[styles.contactCardBody, { color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)' }]}>
              To cancel this booking, please contact the venue owner directly.
            </Text>
            {branchPhone ? (
              <TouchableOpacity style={styles.phoneBtn} onPress={() => Linking.openURL(`tel:${branchPhone}`)}>
                <Ionicons name="call-outline" size={14} color="#F59E0B" />
                <Text style={styles.phoneBtnText}>{branchPhone}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* Action buttons for COACH_PENDING */}
        {r.status === ReservationStatus.COACH_PENDING && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={handleAccept}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Accept Booking</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={handleDecline}>
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Decline Booking</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Mark as Paid button for CONFIRMED */}
        {r.status === ReservationStatus.CONFIRMED && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionBtn, styles.paidBtn]} onPress={handleMarkAsPaid}>
              <Ionicons name="cash-outline" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>Mark as Paid</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  scroll: { padding: spacing.lg, paddingBottom: 40, gap: spacing.md },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, borderRadius: 14, borderWidth: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: 18, padding: spacing.lg },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: 'rgba(120,120,120,0.1)' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 15, fontWeight: '600' },
  actions: { gap: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  acceptBtn: { backgroundColor: '#00C16A' },
  declineBtn: { backgroundColor: '#FF4444' },
  paidBtn: { backgroundColor: '#6B7280' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  contactCard: { borderRadius: 14, borderWidth: 1, padding: spacing.md, gap: 8 },
  contactCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactCardTitle: { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  contactCardBody: { fontSize: 13, lineHeight: 18 },
  phoneBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.12)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  phoneBtnText: { color: '#F59E0B', fontSize: 13, fontWeight: '700' },
});
