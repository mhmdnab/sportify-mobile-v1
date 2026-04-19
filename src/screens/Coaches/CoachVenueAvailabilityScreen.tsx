import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../stores/auth.store';
import { useReservationsStore } from '../../stores/reservations.store';
import { api } from '../../lib/api';
import { getNext14Days, formatTime, formatSlotDate } from '../../utils/date';
import { formatPrice } from '../../utils/currency';
import { HomeStackParamList } from '../../types/navigation';
import { Coach, Slot } from '../../types/api';

type Props = NativeStackScreenProps<HomeStackParamList, 'CoachVenueAvailability'>;

const days = getNext14Days();

export function CoachVenueAvailabilityScreen({ navigation, route }: Props) {
  const { coachId, venueId, venueName } = route.params;
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const user = useAuthStore((s) => s.user);
  const { createReservation, isLoading: bookingLoading } = useReservationsStore();

  const [coach, setCoach] = useState<Coach | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [coachRate, setCoachRate] = useState(0);

  // Fetch coach details once
  useEffect(() => {
    api.get<any>(`/coaches/${coachId}`).then((res) => {
      const c = res.data?.data ?? res.data;
      setCoach(c);
      setCoachRate(c?.hourlyRate ?? 0);
    }).catch(() => {});
  }, [coachId]);

  // Fetch slots when date changes
  const fetchSlots = useCallback(async (date: Date) => {
    setSlotsLoading(true);
    setSelectedSlot(null);
    try {
      const dateStr = formatSlotDate(date);
      const res = await api.get<any>(`/coaches/${coachId}/slots`, {
        params: { venueId, date: dateStr },
      });
      const data = res.data?.data ?? res.data;
      setSlots(data?.slots ?? []);
    } catch { setSlots([]); } finally { setSlotsLoading(false); }
  }, [coachId, venueId]);

  useEffect(() => { fetchSlots(selectedDate); }, [selectedDate]);

  const handleDateSelect = (date: Date) => setSelectedDate(date);

  const handleBookNow = () => {
    if (!selectedSlot) { Alert.alert('Select a Time', 'Please select a time slot to continue.'); return; }
    setConfirmVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    try {
      const reservation = await createReservation({
        slotId: selectedSlot.id,
        slotDate: formatSlotDate(selectedDate),
        notes: notes || undefined,
        withCoach: true,
        coachId,
      });
      setConfirmVisible(false);
      setSelectedSlot(null);
      Alert.alert('Booking Confirmed!', 'Your reservation has been created.', [
        {
          text: 'OK',
          onPress: () => (navigation as any).navigate('BookingsTab', {
            screen: 'ReservationDetail',
            params: { reservationId: reservation.id },
          }),
        },
      ]);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Something went wrong.';
      Alert.alert('Booking Failed', Array.isArray(msg) ? msg.join('\n') : msg);
    }
  };

  // Calculate total cost
  const slotHours = selectedSlot
    ? (() => {
        const [sh, sm] = (selectedSlot.startTime ?? '00:00').split(':').map(Number);
        const [eh, em] = (selectedSlot.endTime ?? '00:00').split(':').map(Number);
        return Math.max(((eh * 60 + em) - (sh * 60 + sm)) / 60, 0);
      })()
    : 0;
  const totalCost = selectedSlot ? (selectedSlot.price ?? 0) + coachRate * slotHours : 0;

  const selectedDateKey = selectedDate.toDateString();

  return (
    <View style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? '#040B1E' : colors.navy }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 12 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{venueName ?? 'Availability'}</Text>
          {coach && (
            <Text style={styles.headerSub} numberOfLines={1}>
              with {coach.user?.name ?? `Coach #${coachId}`} · ${coachRate}/hr
            </Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Date Picker */}
        <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {days.map((day) => {
            const isSelected = day.date.toDateString() === selectedDateKey;
            return (
              <TouchableOpacity
                key={day.date.toISOString()}
                onPress={() => handleDateSelect(day.date)}
                style={[styles.dateChip, { backgroundColor: tc.cardBg }, isSelected && styles.dateChipSelected]}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateLabel, { color: tc.textSecondary }, isSelected && styles.dateLabelSelected]}>
                  {day.label}
                </Text>
                <Text style={[styles.dateNum, { color: tc.textPrimary }, isSelected && styles.dateNumSelected]}>
                  {day.dayNum}
                </Text>
                <View style={{ height: 6 }} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Reservation Name */}
        <View style={styles.reservationNameSection}>
          <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Reservation Name</Text>
          <View style={[styles.nameCard, { backgroundColor: tc.cardBg }]}>
            <FontAwesome6 name="people-group" size={16} color={tc.textSecondary} />
            <Text style={[styles.nameText, { color: tc.textPrimary }]}>{user?.name || 'Guest'}</Text>
          </View>
        </View>

        {/* Time Slots */}
        <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Available Time Slots</Text>
        {slotsLoading ? (
          <ActivityIndicator color="#0B1A3E" style={{ marginTop: 20 }} />
        ) : slots.length === 0 ? (
          <View style={styles.noSlots}>
            <Ionicons name="time-outline" size={40} color={tc.textHint} />
            <Text style={[styles.noSlotsText, { color: tc.textHint }]}>No slots available on this date</Text>
          </View>
        ) : (
          <View style={styles.slotsContainer}>
            {slots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isUnavailable = slot.isAvailable === false;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => !isUnavailable && setSelectedSlot(slot)}
                  disabled={isUnavailable}
                  style={[
                    styles.slotCard,
                    { backgroundColor: tc.cardBg },
                    isSelected && styles.slotCardSelected,
                    isUnavailable && styles.slotCardUnavailable,
                  ]}
                  activeOpacity={isUnavailable ? 1 : 0.7}
                >
                  <View style={styles.slotTimeRow}>
                    <Ionicons name="time-outline" size={18} color={isSelected ? colors.white : tc.textPrimary} />
                    <Text style={[styles.slotTime, { color: tc.textPrimary }, isSelected && styles.slotTextSelected, isUnavailable && { color: tc.textHint }]}>
                      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 2 }}>
                    <Text style={[styles.slotPrice, isSelected && styles.slotTextSelected, isUnavailable && { color: tc.textHint }]}>
                      {formatPrice(slot.price)}
                    </Text>
                    {isUnavailable && <Text style={styles.bookedLabel}>Booked</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Coach cost preview */}
        {selectedSlot && (
          <View style={[styles.costPreview, { backgroundColor: tc.cardBg }]}>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: tc.textSecondary }]}>Slot</Text>
              <Text style={[styles.costVal, { color: tc.textPrimary }]}>{formatPrice(selectedSlot.price ?? 0)}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={[styles.costLabel, { color: tc.textSecondary }]}>Coach ({slotHours}h × ${coachRate})</Text>
              <Text style={[styles.costVal, { color: tc.textPrimary }]}>{formatPrice(coachRate * slotHours)}</Text>
            </View>
            <View style={[styles.costRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tc.border, marginTop: 8, paddingTop: 8 }]}>
              <Text style={{ fontWeight: '700', fontSize: 15, color: tc.textPrimary }}>Total</Text>
              <Text style={{ fontWeight: '800', fontSize: 17, color: '#0B1A3E' }}>{formatPrice(totalCost)}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: tc.cardBg }]}>
        <TouchableOpacity
          style={[styles.bookNowBtn, !selectedSlot && styles.bookNowBtnDisabled]}
          onPress={handleBookNow}
          activeOpacity={0.8}
          disabled={!selectedSlot}
        >
          <Text style={styles.bookNowText}>Book with Coach</Text>
        </TouchableOpacity>
      </View>

      {/* Confirm Modal */}
      <Modal visible={confirmVisible} animationType="slide" transparent onRequestClose={() => setConfirmVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setConfirmVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: tc.cardBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <Text style={[styles.sheetTitle, { color: tc.textPrimary }]}>Confirm Booking</Text>
            <View style={{ marginBottom: spacing.lg }}>
              {[
                { label: 'Venue', value: venueName ?? '—' },
                { label: 'Coach', value: coach?.user?.name ?? `Coach #${coachId}` },
                { label: 'Date', value: selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) },
                selectedSlot ? { label: 'Time', value: `${formatTime(selectedSlot.startTime)} – ${formatTime(selectedSlot.endTime)}` } : null,
                selectedSlot ? { label: 'Total', value: formatPrice(totalCost), highlight: true } : null,
              ].filter(Boolean).map((row: any) => (
                <View key={row.label} style={[styles.summaryRow, { borderBottomColor: tc.border }]}>
                  <Text style={[styles.summaryLabel, { color: tc.textSecondary }]}>{row.label}</Text>
                  <Text style={[styles.summaryValue, { color: tc.textPrimary }, row.highlight && { color: colors.navy, fontSize: 16, fontWeight: '700' }]}>
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
            <TextInput
              style={[styles.notesInput, { backgroundColor: tc.surface, color: tc.textPrimary }]}
              placeholder="Add notes (optional)"
              placeholderTextColor={tc.textHint}
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={512}
            />
            <Button title="Confirm & Book" onPress={handleConfirmBooking} loading={bookingLoading} />
            <Button title="Cancel" onPress={() => setConfirmVisible(false)} variant="ghost" style={{ marginTop: spacing.sm }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    backgroundColor: colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scrollContent: { paddingTop: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12, paddingHorizontal: spacing.screenPadding },
  dateRow: { paddingHorizontal: spacing.screenPadding, paddingBottom: 20, gap: 10 },
  dateChip: {
    width: 68, height: 84, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  dateChipSelected: { backgroundColor: colors.navy },
  dateLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  dateLabelSelected: { color: colors.white },
  dateNum: { fontSize: 20, fontWeight: '700' },
  dateNumSelected: { color: colors.white },
  reservationNameSection: { marginBottom: 20 },
  nameCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.screenPadding,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  nameText: { fontSize: 15, fontWeight: '600' },
  slotsContainer: { paddingHorizontal: spacing.screenPadding, gap: 10 },
  slotCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 }, android: { elevation: 2 } }),
  },
  slotCardSelected: { backgroundColor: colors.navy, borderWidth: 1.5, borderColor: colors.navy },
  slotCardUnavailable: { opacity: 0.45 },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotTime: { fontSize: 15, fontWeight: '600' },
  slotPrice: { fontSize: 15, fontWeight: '700', color: colors.navy },
  slotTextSelected: { color: colors.white },
  bookedLabel: { fontSize: 10, fontWeight: '600', color: colors.error, textTransform: 'uppercase', letterSpacing: 0.5 },
  noSlots: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  noSlotsText: { fontSize: 15 },
  costPreview: {
    margin: spacing.screenPadding,
    marginTop: spacing.lg,
    borderRadius: 14,
    padding: spacing.md,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  costLabel: { fontSize: 13 },
  costVal: { fontSize: 13, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0, paddingTop: 16, paddingHorizontal: spacing.screenPadding,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
  bookNowBtn: { backgroundColor: '#0B1A3E', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  bookNowBtnDisabled: { backgroundColor: colors.textHint },
  bookNowText: { fontSize: 17, fontWeight: '700', color: colors.white },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.screenPadding, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  notesInput: { borderRadius: 12, padding: spacing.md, fontSize: 15, minHeight: 60, marginBottom: spacing.lg, textAlignVertical: 'top' },
});
