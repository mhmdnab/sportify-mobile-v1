import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
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
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const accentColor = isDark ? colors.navyLight : colors.navy;

  if (slots.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: tc.textHint }]}>No slots available for this day</Text>
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
            style={[
              styles.slot,
              { backgroundColor: tc.cardBg, borderColor: accentColor },
              isSelected && { backgroundColor: accentColor, borderColor: accentColor },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.time, { color: tc.textPrimary }, isSelected && styles.selectedText]}>
              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
            </Text>
            <Text style={[styles.price, { color: accentColor }, isSelected && styles.selectedText]}>
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
    borderWidth: 1.5,
    borderRadius: radius.input,
    paddingVertical: 10,
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: '700',
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
  },
});
