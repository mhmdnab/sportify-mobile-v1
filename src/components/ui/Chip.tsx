import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../stores/theme.store';
import { radius, sizes, spacing } from '../../theme/spacing';

interface ChipProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, active = false, onPress, style }: ChipProps) {
  const isDark = useThemeStore((s) => s.isDark);
  const activeBg = isDark ? colors.navyLight : colors.navy;
  const inactiveBg = isDark ? colors.navyMid : colors.white;
  const inactiveBorder = isDark ? '#1A2A52' : colors.border;
  const inactiveTextColor = isDark ? '#EEF0F6' : colors.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        active
          ? { backgroundColor: activeBg, borderWidth: 1, borderColor: activeBg }
          : { backgroundColor: inactiveBg, borderWidth: 1, borderColor: inactiveBorder },
        style,
      ]}
    >
      <Text style={[styles.label, { color: active ? colors.white : inactiveTextColor }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: sizes.chipHeight,
    borderRadius: radius.chip,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
