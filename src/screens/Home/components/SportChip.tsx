import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Platform } from 'react-native';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
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
  const isDark = useThemeStore((s) => s.isDark);
  const selectedBg = isDark ? '#1D4ED8' : colors.navy;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        { backgroundColor: tc.cardBg, borderColor: tc.border },
        isSelected && { backgroundColor: selectedBg, borderColor: selectedBg },
      ]}
    >
      <View style={styles.iconCircle}>
        <SportIcon sportName={sport.name} size={18} color={isSelected ? colors.white : tc.textPrimary} />
      </View>
      <Text style={[styles.label, { color: isSelected ? colors.white : tc.textPrimary }]}>
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
    ...Platform.select({
      ios: { shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
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
  },
});
