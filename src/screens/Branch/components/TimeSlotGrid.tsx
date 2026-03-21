import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, radius } from '../../../theme/spacing';
import { Slot } from '../../../types/api';
import { formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

interface TimeSlotGridProps {
  slots: Slot[];
  selectedSlotId: number | null;
  onSlotSelect: (slot: Slot) => void;
}

export function TimeSlotGrid({ slots, selectedSlotId, onSlotSelect }: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No slots available for this day</Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {slots.map((slot) => {
        const isSelected = selectedSlotId === slot.id;
        return (
          <TouchableOpacity
            key={slot.id}
            onPress={() => onSlotSelect(slot)}
            style={[styles.slot, isSelected && styles.selectedSlot]}
            activeOpacity={0.7}
          >
            <Text style={[styles.time, isSelected && styles.selectedText]}>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </Text>
            <Text style={[styles.price, isSelected && styles.selectedText]}>
              {formatPrice(slot.price)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing.sm,
  },
  slot: {
    width: '31%',
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.input,
    paddingVertical: 10,
    alignItems: 'center',
  },
  selectedSlot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  selectedText: {
    color: colors.white,
  },
  empty: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textHint,
  },
});
