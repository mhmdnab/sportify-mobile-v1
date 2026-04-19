import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Switch,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome6 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing } from '../../theme/spacing';
import { useVenuesStore } from '../../stores/venues.store';
import { useAuthStore } from '../../stores/auth.store';
import { useReservationsStore } from '../../stores/reservations.store';
import { Coach, Slot } from '../../types/api';
import { api } from '../../lib/api';
import { getDayOfWeek, getNext14Days, formatTime, formatSlotDate } from '../../utils/date';
import { formatPrice } from '../../utils/currency';
import { HomeStackParamList } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';

type Props = NativeStackScreenProps<HomeStackParamList, 'Reservation'>;

const days = getNext14Days();

function slotDuration(slot: Slot): number {
  if (!slot.startTime || !slot.endTime) return 1;
  const [sh, sm] = (slot.startTime as string).split(':').map(Number);
  const [eh, em] = (slot.endTime as string).split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
}

export function ReservationScreen({ route, navigation }: Props) {
  const { venueId, preselectedCoachId } = route.params;
  const insets = useSafeAreaInsets();
  const { currentVenue, fetchVenueById } = useVenuesStore();
  const user = useAuthStore((s) => s.user);
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { createReservation, isLoading: bookingLoading } = useReservationsStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState<Slot[]>([]);
  const [notes, setNotes] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);

  // Coach booking
  const [availableCoaches, setAvailableCoaches] = useState<Coach[]>([]);
  const [withCoach, setWithCoach] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState<number | null>(null);

  useEffect(() => {
    fetchVenueById(venueId, formatSlotDate(selectedDate));
  }, [venueId]);

  useEffect(() => {
    const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayName = dayNames[selectedDate.getDay()];
    api.get<any>('/coaches', { params: { venueId, day: dayName, page: 1, limit: 50 } }).then((res) => {
      const list = res.data?.list ?? res.data?.data?.list ?? [];
      setAvailableCoaches(list);
      if (preselectedCoachId) {
        const match = list.find((c: any) => c.id === preselectedCoachId);
        if (match) {
          setSelectedCoachId(preselectedCoachId);
          setWithCoach(true);
          return;
        }
      }
      if (list.length > 0 && !list.find((c: any) => c.id === selectedCoachId)) {
        setSelectedCoachId(list[0].id);
      }
    }).catch(() => {});
  }, [venueId, selectedDate]);

  const dayOfWeek = getDayOfWeek(selectedDate);

  const hasSlots = (date: Date) => {
    const dow = getDayOfWeek(date);
    const avail = currentVenue?.availability?.find((a) => a.day === dow && a.isOpen);
    return (avail?.slots || []).length > 0;
  };

  const availableSlots = useMemo(() => {
    if (!currentVenue?.availability) return [];
    const dayAvailability = currentVenue.availability.find(
      (a) => a.day === dayOfWeek && a.isOpen,
    );
    return [...(dayAvailability?.slots || [])].sort((a, b) =>
      (a.startTime as string).localeCompare(b.startTime as string),
    );
  }, [currentVenue, dayOfWeek]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlots([]);
    fetchVenueById(venueId, formatSlotDate(date));
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.id === slot.id);
      if (exists) return prev.filter((s) => s.id !== slot.id);
      return [...prev, slot];
    });
  };

  // Derived totals
  const selectedCoach = availableCoaches.find((c) => c.id === selectedCoachId);
  const totalVenuePrice = selectedSlots.reduce((acc, s) => acc + (s.price ?? 0), 0);
  const totalDurationHours = selectedSlots.reduce((acc, s) => acc + slotDuration(s), 0);
  const coachFee = withCoach && selectedCoach ? (selectedCoach.hourlyRate ?? 0) * totalDurationHours : 0;
  const grandTotal = totalVenuePrice + coachFee;

  const handleBookNow = () => {
    if (selectedSlots.length === 0) {
      Alert.alert('Select a Time', 'Please select at least one time slot to continue.');
      return;
    }
    setConfirmVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (selectedSlots.length === 0) return;
    const [primarySlot, ...extraSlots] = selectedSlots;
    try {
      const reservation = await createReservation({
        slotId: primarySlot.id,
        ...(extraSlots.length > 0 && { additionalSlotIds: extraSlots.map((s) => s.id) }),
        slotDate: formatSlotDate(selectedDate),
        notes: notes || undefined,
        ...(withCoach && selectedCoachId && { withCoach: true, coachId: selectedCoachId }),
      });
      setConfirmVisible(false);
      setSelectedSlots([]);
      await fetchVenueById(venueId, formatSlotDate(selectedDate));
      Alert.alert(
        selectedSlots.length > 1 ? 'Bookings Confirmed!' : 'Booking Confirmed!',
        selectedSlots.length > 1
          ? `${selectedSlots.length} slots booked successfully.`
          : 'Your reservation has been created. You can view it in your bookings.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
      Alert.alert('Booking Failed', Array.isArray(msg) ? msg.join('\n') : msg);
    }
  };

  const selectedDateKey = selectedDate.toDateString();
  const venueName = currentVenue?.name || 'Venue';

  return (
    <View style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: isDark ? '#040B1E' : colors.navy }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{venueName}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Date Picker */}
        <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
          {days.map((day) => {
            const isSelected = day.date.toDateString() === selectedDateKey;
            const available = hasSlots(day.date);
            return (
              <TouchableOpacity
                key={day.date.toISOString()}
                onPress={() => handleDateSelect(day.date)}
                style={[
                  styles.dateChip,
                  isDark ? { backgroundColor: '#0F1F45', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' } : { backgroundColor: tc.cardBg },
                  isSelected && { backgroundColor: isDark ? '#1D4ED8' : colors.navy, borderColor: isDark ? '#3B6FE0' : colors.navy },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateLabel, { color: isSelected ? colors.white : tc.textSecondary }]}>
                  {day.label}
                </Text>
                <Text style={[styles.dateNum, { color: isSelected ? colors.white : tc.textPrimary }]}>
                  {day.dayNum}
                </Text>
                <View style={styles.dotRow}>
                  {available && <View style={[styles.availDot, isSelected && styles.availDotSelected]} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Reservation Name */}
        <View style={styles.reservationNameSection}>
          <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Reservation Name</Text>
          <View style={[styles.reservationNameCard, { backgroundColor: tc.cardBg }]}>
            <FontAwesome6 name="people-group" size={16} color={tc.textSecondary} />
            <Text style={[styles.reservationNameText, { color: tc.textPrimary }]}>{user?.name || 'Guest'}</Text>
          </View>
        </View>

        {/* Time Slots */}
        <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>
          Available Time Slots
          {selectedSlots.length > 0 && (
            <Text style={{ color: isDark ? '#A2B8FF' : colors.navy, fontSize: 13 }}> · {selectedSlots.length} selected</Text>
          )}
        </Text>
        {availableSlots.length === 0 ? (
          <View style={styles.noSlotsContainer}>
            <Ionicons name="time-outline" size={40} color={tc.textHint} />
            <Text style={[styles.noSlotsText, { color: tc.textHint }]}>No available slots for this day</Text>
            <Text style={[styles.noSlotsHint, { color: tc.textHint }]}>Look for dates with a green dot above</Text>
          </View>
        ) : (
          <View style={styles.slotsContainer}>
            {availableSlots.map((slot) => {
              const isSelected = selectedSlots.some((s) => s.id === slot.id);
              const isUnavailable = slot.isAvailable === false;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => !isUnavailable && handleSlotSelect(slot)}
                  disabled={isUnavailable}
                  style={[
                    styles.slotCard,
                    isDark
                      ? { backgroundColor: '#0F1F45', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }
                      : { backgroundColor: tc.cardBg },
                    isSelected && { backgroundColor: isDark ? '#1D4ED8' : colors.navy, borderColor: isDark ? '#3B6FE0' : colors.navy },
                    isUnavailable && styles.slotCardUnavailable,
                  ]}
                  activeOpacity={isUnavailable ? 1 : 0.7}
                >
                  <View style={styles.slotTimeRow}>
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'time-outline'}
                      size={18}
                      color={isUnavailable ? tc.textHint : isSelected ? colors.white : (isDark ? '#A2B8FF' : tc.textPrimary)}
                    />
                    <Text style={[styles.slotTime, { color: isSelected ? colors.white : tc.textPrimary }, isUnavailable && styles.slotTextUnavailable]}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </Text>
                  </View>
                  <View style={styles.slotRightCol}>
                    <Text style={[styles.slotPrice, { color: isSelected ? colors.white : (isDark ? '#A2B8FF' : colors.navy) }, isUnavailable && styles.slotTextUnavailable]}>
                      {formatPrice(slot.price)}
                    </Text>
                    {isUnavailable && <Text style={styles.slotUnavailableLabel}>Booked</Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Coach booking toggle */}
        {availableCoaches.length > 0 && selectedSlots.length > 0 && (
          <View style={[styles.coachSection, { backgroundColor: tc.cardBg }]}>
            <View style={styles.coachToggleRow}>
              <View style={styles.coachToggleLeft}>
                <FontAwesome6 name="people-group" size={16} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
                <Text style={[styles.coachToggleLabel, { color: tc.textPrimary }]}>Book with Coach</Text>
              </View>
              <Switch
                value={withCoach}
                onValueChange={setWithCoach}
                trackColor={{ true: isDark ? colors.navyLight : '#0B1A3E', false: isDark ? '#2A3A5C' : '#888' }}
                thumbColor="#fff"
              />
            </View>
            {withCoach && (
              <View style={styles.coachList}>
                {availableCoaches.map((coach) => {
                  const isCoachSelected = selectedCoachId === coach.id;
                  return (
                    <TouchableOpacity
                      key={coach.id}
                      onPress={() => setSelectedCoachId(coach.id)}
                      style={[styles.coachItem, isCoachSelected && styles.coachItemSelected]}
                    >
                      <View style={styles.coachItemLeft}>
                        <View style={[styles.coachAvatar, { backgroundColor: isCoachSelected ? (isDark ? colors.navyLight : '#0B1A3E') : (isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.1)') }]}>
                          <FontAwesome6 name="people-group" size={13} color={isCoachSelected ? '#fff' : (isDark ? '#A2B8FF' : '#0B1A3E')} />
                        </View>
                        <View>
                          <Text style={[styles.coachName, { color: tc.textPrimary }]}>{coach.user?.name ?? `Coach #${coach.id}`}</Text>
                          {coach.sport ? <Text style={[styles.coachSport, { color: tc.textSecondary }]}>{coach.sport}</Text> : null}
                        </View>
                      </View>
                      <Text style={[styles.coachRate, { color: isDark ? '#A2B8FF' : '#0B1A3E' }]}>${coach.hourlyRate}/hr</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom Cost + Book Now */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: tc.cardBg }]}>
        {selectedSlots.length > 0 && (
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: tc.textSecondary }]}>
              {withCoach && selectedCoachId ? 'Total (with coach)' : 'Total'}
              {selectedSlots.length > 1 ? ` · ${selectedSlots.length} slots` : ''}
            </Text>
            <Text style={[styles.costValue, { color: isDark ? '#A2B8FF' : colors.navy }]}>{formatPrice(grandTotal)}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.bookNowBtn, { backgroundColor: isDark ? '#1D4ED8' : colors.navy }, selectedSlots.length === 0 && styles.bookNowBtnDisabled]}
          onPress={handleBookNow}
          activeOpacity={0.8}
          disabled={selectedSlots.length === 0}
        >
          <Text style={styles.bookNowText}>
            {selectedSlots.length > 1 ? `Book ${selectedSlots.length} Slots` : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal visible={confirmVisible} animationType="slide" transparent onRequestClose={() => setConfirmVisible(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setConfirmVisible(false)} />
          <View style={[styles.modalSheet, { backgroundColor: tc.cardBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />
            <Text style={[styles.sheetTitle, { color: tc.textPrimary }]}>Confirm Booking</Text>

            <View style={styles.summarySection}>
              <SummaryRow label="Venue" value={venueName} tc={tc} />
              <SummaryRow
                label="Date"
                value={selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                tc={tc}
              />
              {/* One row per selected slot */}
              {selectedSlots.map((slot, i) => (
                <SummaryRow
                  key={slot.id}
                  label={selectedSlots.length > 1 ? `Slot ${i + 1}` : 'Time'}
                  value={`${formatTime(slot.startTime)} – ${formatTime(slot.endTime)}  ${formatPrice(slot.price)}`}
                  tc={tc}
                />
              ))}

              {/* Coach rows */}
              {withCoach && selectedCoach && (
                <>
                  <SummaryRow
                    label="Coach"
                    value={`${selectedCoach.user?.name ?? `Coach #${selectedCoach.id}`} · $${selectedCoach.hourlyRate}/hr`}
                    tc={tc}
                  />
                  <SummaryRow
                    label={`Coach fee (${totalDurationHours}h × $${selectedCoach.hourlyRate})`}
                    value={formatPrice(coachFee)}
                    tc={tc}
                    highlight
                  />
                </>
              )}

              {/* Total */}
              <SummaryRow
                label={selectedSlots.length > 1 ? `Venue subtotal (${selectedSlots.length} slots)` : 'Venue fee'}
                value={formatPrice(totalVenuePrice)}
                tc={tc}
              />
              <SummaryRow label="Total" value={formatPrice(grandTotal)} tc={tc} highlight />
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
            <Button
              title="Cancel"
              onPress={() => setConfirmVisible(false)}
              variant="ghost"
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function SummaryRow({ label, value, highlight, tc }: { label: string; value: string; highlight?: boolean; tc: any }) {
  const isDarkRow = useThemeStore((s) => s.isDark);
  return (
    <View style={[summaryStyles.row, { borderBottomColor: tc.border }]}>
      <Text style={[summaryStyles.label, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[summaryStyles.value, { color: highlight ? (isDarkRow ? '#A2B8FF' : colors.navy) : tc.textPrimary }, highlight && summaryStyles.highlightSize]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  label: { fontSize: 14, flex: 1, paddingRight: 8 },
  value: { fontSize: 14, fontWeight: '600', textAlign: 'right' },
  highlightSize: { fontSize: 16, fontWeight: '700' },
});

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.white, textAlign: 'center', marginHorizontal: 12 },
  scrollContent: { paddingTop: 20 },
  sectionLabel: { fontSize: 16, fontWeight: '700', marginBottom: 12, paddingHorizontal: spacing.screenPadding },
  dateRow: { paddingHorizontal: spacing.screenPadding, paddingBottom: 20, gap: 10 },
  dateChip: {
    width: 68, height: 84, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  dateLabel: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  dateNum: { fontSize: 20, fontWeight: '700' },
  dotRow: { height: 6, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  availDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22c55e' },
  availDotSelected: { backgroundColor: colors.white },
  reservationNameSection: { marginBottom: 20 },
  reservationNameCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: spacing.screenPadding,
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  reservationNameText: { fontSize: 15, fontWeight: '600' },
  slotsContainer: { paddingHorizontal: spacing.screenPadding, gap: 10 },
  slotCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  slotCardSelected: { borderWidth: 1.5 },
  slotCardUnavailable: { opacity: 0.45, borderWidth: 1.5, borderStyle: 'dashed' },
  slotRightCol: { alignItems: 'flex-end', gap: 2 },
  slotUnavailableLabel: { fontSize: 10, fontWeight: '600', color: colors.error, textTransform: 'uppercase', letterSpacing: 0.5 },
  slotTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotTime: { fontSize: 15, fontWeight: '600' },
  slotPrice: { fontSize: 15, fontWeight: '700' },
  slotTextUnavailable: { color: colors.textHint },
  noSlotsContainer: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  noSlotsText: { fontSize: 15 },
  noSlotsHint: { fontSize: 12, marginTop: 4 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 16, paddingHorizontal: spacing.screenPadding,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  costLabel: { fontSize: 16, fontWeight: '600' },
  costValue: { fontSize: 22, fontWeight: '700' },
  bookNowBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  bookNowBtnDisabled: { backgroundColor: colors.textHint },
  bookNowText: { fontSize: 17, fontWeight: '700', color: colors.white },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.screenPadding, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.lg },
  sheetTitle: { fontSize: 20, fontWeight: '700', marginBottom: spacing.lg },
  summarySection: { marginBottom: spacing.lg },
  notesInput: {
    borderRadius: 12, padding: spacing.md, fontSize: 15,
    minHeight: 60, marginBottom: spacing.lg, textAlignVertical: 'top',
  },
  coachSection: {
    borderRadius: 16, padding: spacing.md,
    marginTop: spacing.lg, marginBottom: spacing.sm,
    marginHorizontal: spacing.screenPadding,
  },
  coachToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coachToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coachToggleLabel: { fontSize: 15, fontWeight: '600' },
  coachList: { marginTop: spacing.md, gap: 8 },
  coachItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: spacing.md, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(130,150,190,0.2)', backgroundColor: 'rgba(130,150,190,0.04)',
  },
  coachItemSelected: { borderColor: '#162B5C', backgroundColor: 'rgba(162,184,255,0.08)' },
  coachItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coachAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  coachName: { fontSize: 14, fontWeight: '600' },
  coachSport: { fontSize: 12, marginTop: 1 },
  coachRate: { fontSize: 13, fontWeight: '700' },
});
