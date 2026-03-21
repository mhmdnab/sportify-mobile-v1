import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { Sport } from '../../../types/api';

const DARK_NAV = '#1A1A2E';

interface SportChipProps {
  sport: Sport;
  isSelected: boolean;
  onPress: () => void;
}

export function SportChip({ sport, isSelected, onPress }: SportChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, isSelected && styles.selectedChip]}
    >
      <View style={styles.iconCircle}>
        {sport.image ? (
          <Image source={{ uri: sport.image }} style={styles.icon} contentFit="cover" />
        ) : (
          <Ionicons name="football-outline" size={18} color={DARK_NAV} />
        )}
      </View>
      <Text style={[styles.label, isSelected && styles.selectedLabel]}>
        {sport.name}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  selectedChip: {
    borderColor: DARK_NAV,
    backgroundColor: DARK_NAV,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK_NAV,
  },
  selectedLabel: {
    color: colors.white,
  },
});
