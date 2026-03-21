import React, { forwardRef, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { colors } from '../../../theme/colors';
import { spacing, radius } from '../../../theme/spacing';
import { Button } from '../../../components/ui/Button';
import { Slot, Venue } from '../../../types/api';
import { formatTime, formatSlotDate } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';
import { useReservationsStore } from '../../../stores/reservations.store';

interface BookingBottomSheetProps {
  venue: Venue | null;
  slot: Slot | null;
  selectedDate: Date;
  onSuccess: (reservationId: number) => void;
}

export const BookingBottomSheet = forwardRef<BottomSheet, BookingBottomSheetProps>(
  ({ venue, slot, selectedDate, onSuccess }, ref) => {
    const snapPoints = useMemo(() => ['55%'], []);
    const [notes, setNotes] = useState('');
    const { createReservation, isLoading } = useReservationsStore();

    const handleConfirm = async () => {
      if (!slot) return;
      try {
        const reservation = await createReservation({
          slotId: slot.id,
          slotDate: formatSlotDate(selectedDate),
          notes: notes || undefined,
        });
        Alert.alert('Booking Confirmed!', 'Your reservation has been created.', [
          { text: 'OK', onPress: () => onSuccess(reservation.id) },
        ]);
      } catch (error: any) {
        Alert.alert('Booking Failed', error?.response?.data?.message || 'Please try again.');
      }
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        )}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.indicator}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Confirm Booking</Text>

          {venue && (
            <View style={styles.summary}>
              <SummaryRow label="Venue" value={venue.name} />
              <SummaryRow label="Date" value={selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} />
              {slot && (
                <>
                  <SummaryRow label="Time" value={`${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`} />
                  <SummaryRow label="Price" value={formatPrice(slot.price)} highlight />
                </>
              )}
            </View>
          )}

          <TextInput
            style={styles.notesInput}
            placeholder="Add notes (optional)"
            placeholderTextColor={colors.textHint}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={512}
          />

          <Button
            title="Confirm & Book"
            onPress={handleConfirm}
            loading={isLoading}
          />
          <Button
            title="Cancel"
            onPress={() => (ref as any)?.current?.close()}
            variant="ghost"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </BottomSheet>
    );
  },
);

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={summaryStyles.row}>
      <Text style={summaryStyles.label}>{label}</Text>
      <Text style={[summaryStyles.value, highlight && summaryStyles.highlight]}>{value}</Text>
    </View>
  );
}

const summaryStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  highlight: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  indicator: {
    backgroundColor: colors.border,
    width: 40,
  },
  content: {
    padding: spacing.screenPadding,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  summary: {
    marginBottom: spacing.lg,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    minHeight: 60,
    marginBottom: spacing.lg,
    textAlignVertical: 'top',
  },
});
