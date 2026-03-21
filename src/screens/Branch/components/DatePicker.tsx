import React from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { colors } from '../../../theme/colors';
import { spacing, radius } from '../../../theme/spacing';
import { getNext14Days } from '../../../utils/date';

interface DatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const days = getNext14Days();

export function DatePicker({ selectedDate, onDateSelect }: DatePickerProps) {
  const selectedKey = selectedDate.toDateString();

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
            style={[styles.item, isSelected && styles.selectedItem]}
          >
            <Text style={[styles.label, isSelected && styles.selectedText]}>{item.label}</Text>
            <Text style={[styles.dayNum, isSelected && styles.selectedText]}>{item.dayNum}</Text>
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
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  selectedItem: {
    backgroundColor: colors.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  selectedText: {
    color: colors.white,
  },
});
