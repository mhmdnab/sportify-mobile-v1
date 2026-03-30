import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { spacing } from '../../../theme/spacing';
import { Sport } from '../../../types/api';
import { SportIcon } from '../../../components/ui/SportIcon';

interface SportChipProps {
  sport: Sport;
  isSelected: boolean;
  onPress: () => void;
}

export function SportChip({ sport, isSelected, onPress }: SportChipProps) {
  const tc = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, { backgroundColor: tc.cardBg, borderColor: tc.border }, isSelected && styles.selectedChip]}
    >
      <View style={styles.iconCircle}>
        <SportIcon sportName={sport.name} size={18} color={isSelected ? colors.white : tc.textPrimary} />
      </View>
      <Text style={[styles.label, { color: tc.textPrimary }, isSelected && styles.selectedLabel]}>
        {sport.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  selectedChip: {
    borderColor: colors.navy,
    backgroundColor: colors.navy,
    ...Platform.select({
      ios: {
        shadowColor: colors.navy,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navy,
  },
  selectedLabel: {
    color: colors.white,
  },
});
