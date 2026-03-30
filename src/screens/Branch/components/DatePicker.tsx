import React from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { spacing, radius } from '../../../theme/spacing';
import { getNext14Days } from '../../../utils/date';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const days = getNext14Days();

export function DatePicker({ selectedDate, onDateSelect }: DatePickerProps) {
  const selectedKey = selectedDate.toDateString();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const selectedBg = isDark ? colors.navyLight : colors.navy;

  return (
    <FlatList
      data={days}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      keyExtractor={(item) => item.date.toISOString()}
      renderItem={({ item }) => {
        const isSelected = item.date.toDateString() === selectedKey;
        return (
          <TouchableOpacity
            onPress={() => onDateSelect(item.date)}
            style={[
              styles.item,
              { backgroundColor: tc.cardBg },
              isSelected && { backgroundColor: selectedBg },
            ]}
          >
            <Text style={[styles.label, { color: tc.textSecondary }, isSelected && styles.selectedText]}>{item.label}</Text>
            <Text style={[styles.dayNum, { color: tc.textPrimary }, isSelected && styles.selectedText]}>{item.dayNum}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  item: {
    width: 64,
    height: 72,
    borderRadius: radius.input,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
  },
  selectedText: {
    color: colors.white,
  },
});
