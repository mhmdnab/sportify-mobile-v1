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
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing } from '../../theme/spacing';
import { useVenuesStore } from '../../stores/venues.store';
import { useAuthStore } from '../../stores/auth.store';
import { useReservationsStore } from '../../stores/reservations.store';
import { Slot } from '../../types/api';
import { getDayOfWeek, getNext14Days, formatTime, formatSlotDate } from '../../utils/date';
import { formatPrice } from '../../utils/currency';
import { HomeStackParamList } from '../../types/navigation';
import { Button } from '../../components/ui/Button';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';

type Props = NativeStackScreenProps<HomeStackParamList, 'Reservation'>;

const days = getNext14Days();

export function ReservationScreen({ route, navigation }: Props) {
  const { venueId } = route.params;
  const insets = useSafeAreaInsets();
  const { currentVenue, fetchVenueById } = useVenuesStore();
  const user = useAuthStore((s) => s.user);
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { createReservation, isLoading: bookingLoading } = useReservationsStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    if (!currentVenue || currentVenue.id !== venueId) {
      fetchVenueById(venueId);
    }
  }, [venueId]);

  const dayOfWeek = getDayOfWeek(selectedDate);

  const hasSlots = (date: Date) => {
    const dow = getDayOfWeek(date);
    const avail = currentVenue?.availability?.find((a) => a.day === dow && a.isOpen);
    return (avail?.slots || []).filter((s) => s.isAvailable !== false).length > 0;
  };

  const availableSlots = useMemo(() => {
    if (!currentVenue?.availability) return [];
    const dayAvailability = currentVenue.availability.find(
      (a) => a.day === dayOfWeek && a.isOpen,
    );
    return dayAvailability?.slots || [];
  }, [currentVenue, dayOfWeek]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleBookNow = () => {
    if (!selectedSlot) {
      Alert.alert('Select a Time', 'Please select a time slot to continue.');
      return;
    }
    setConfirmVisible(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    try {
      const reservation = await createReservation({
        slotId: selectedSlot.id,
        slotDate: formatSlotDate(selectedDate),
        notes: notes || undefined,
      });
      setConfirmVisible(false);
      setSelectedSlot(null);
      await fetchVenueById(venueId);
      Alert.alert('Booking Confirmed!', 'Your reservation has been created.', [
        {
          text: 'OK',
          onPress: () => {
            (navigation as any).navigate('BookingsTab', {
              screen: 'ReservationDetail',
              params: { reservationId: reservation.id },
            });
          },
        },
      ]);
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Date Picker */}
        <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateRow}
        >
          {days.map((day) => {
            const isSelected = day.date.toDateString() === selectedDateKey;
            const available = hasSlots(day.date);
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
                <View style={styles.dotRow}>
                  {available && (
                    <View style={[styles.availDot, isSelected && styles.availDotSelected]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Reservation Name */}
        <View style={styles.reservationNameSection}>
          <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Reservation Name</Text>
          <View style={[styles.reservationNameCard, { backgroundColor: tc.cardBg }]}>
            <Ionicons name="person-outline" size={18} color={tc.textSecondary} />
            <Text style={[styles.reservationNameText, { color: tc.textPrimary }]}>{user?.name || 'Guest'}</Text>
          </View>
        </View>

        {/* Time Slots */}
        <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>Available Time Slots</Text>
        {availableSlots.length === 0 ? (
          <View style={styles.noSlotsContainer}>
            <Ionicons name="time-outline" size={40} color={tc.textHint} />
            <Text style={[styles.noSlotsText, { color: tc.textHint }]}>No available slots for this day</Text>
            <Text style={[styles.noSlotsHint, { color: tc.textHint }]}>Look for dates with a green dot above</Text>
          </View>
        ) : (
          <View style={styles.slotsContainer}>
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot?.id === slot.id;
              const isUnavailable = slot.isAvailable === false;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => !isUnavailable && handleSlotSelect(slot)}
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
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={isUnavailable ? tc.textHint : isSelected ? colors.white : tc.textPrimary}
                    />
                    <Text style={[styles.slotTime, { color: tc.textPrimary }, isSelected && styles.slotTextSelected, isUnavailable && styles.slotTextUnavailable]}>
                      {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                    </Text>
                  </View>
                  <View style={styles.slotRightCol}>
                    <Text style={[styles.slotPrice, isSelected && styles.slotTextSelected, isUnavailable && styles.slotTextUnavailable]}>
                      {formatPrice(slot.price)}
                    </Text>
                    {isUnavailable && (
                      <Text style={styles.slotUnavailableLabel}>Booked</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 160 }} />
      </ScrollView>

      {/* Bottom Cost + Book Now */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: tc.cardBg }]}>
        {selectedSlot && (
          <View style={styles.costRow}>
            <Text style={[styles.costLabel, { color: tc.textSecondary }]}>Cost</Text>
            <Text style={styles.costValue}>{formatPrice(selectedSlot.price)}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.bookNowBtn, !selectedSlot && styles.bookNowBtnDisabled]}
          onPress={handleBookNow}
          activeOpacity={0.8}
          disabled={!selectedSlot}
        >
          <Text style={styles.bookNowText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setConfirmVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setConfirmVisible(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: tc.cardBg }]}>
            <View style={[styles.modalHandle, { backgroundColor: tc.border }]} />

            <Text style={[styles.sheetTitle, { color: tc.textPrimary }]}>Confirm Booking</Text>

            <View style={styles.summarySection}>
              <SummaryRow label="Venue" value={venueName} tc={tc} />
              <SummaryRow
                label="Date"
                value={selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
                tc={tc}
              />
              {selectedSlot && (
                <>
                  <SummaryRow
                    label="Time"
                    value={`${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}
                    tc={tc}
                  />
                  <SummaryRow label="Price" value={formatPrice(selectedSlot.price)} highlight tc={tc} />
                </>
              )}
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
  return (
    <View style={[summaryStyles.row, { borderBottomColor: tc.border }]}>
      <Text style={[summaryStyles.label, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[summaryStyles.value, { color: tc.textPrimary }, highlight && summaryStyles.highlight]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  highlight: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  scrollContent: {
    paddingTop: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: spacing.screenPadding,
  },
  dateRow: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 20,
    gap: 10,
  },
  dateChip: {
    width: 68,
    height: 84,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  dateChipSelected: {
    backgroundColor: colors.navy,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dateLabelSelected: {
    color: colors.white,
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
  },
  dateNumSelected: {
    color: colors.white,
  },
  dotRow: {
    height: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  availDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  availDotSelected: {
    backgroundColor: colors.white,
  },
  reservationNameSection: {
    marginBottom: 20,
  },
  reservationNameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.screenPadding,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  reservationNameText: {
    fontSize: 15,
    fontWeight: '600',
  },
  slotsContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: 10,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  slotCardSelected: {
    backgroundColor: colors.navy,
    borderWidth: 1.5,
    borderColor: colors.navy,
  },
  slotCardUnavailable: {
    opacity: 0.45,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  slotRightCol: {
    alignItems: 'flex-end',
    gap: 2,
  },
  slotUnavailableLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  slotTextUnavailable: {
    color: colors.textHint,
  },
  slotTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotTime: {
    fontSize: 15,
    fontWeight: '600',
  },
  slotPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  slotTextSelected: {
    color: colors.white,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  noSlotsText: {
    fontSize: 15,
  },
  noSlotsHint: {
    fontSize: 12,
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingHorizontal: spacing.screenPadding,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  costLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  costValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.navy,
  },
  bookNowBtn: {
    backgroundColor: colors.navy,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  bookNowBtnDisabled: {
    backgroundColor: colors.textHint,
  },
  bookNowText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.screenPadding,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  summarySection: {
    marginBottom: spacing.lg,
  },
  notesInput: {
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 15,
    minHeight: 60,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
  },
});
