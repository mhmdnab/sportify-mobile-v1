import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { radius, spacing } from '../../../theme/spacing';
import { Facility } from '../../../types/api';

interface FacilityCardProps {
  facility: Facility;
}

export function FacilityCard({ facility }: FacilityCardProps) {
  return (
    <View style={styles.container}>
      {facility.type?.image ? (
        <Image source={{ uri: facility.type.image }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="fitness-outline" size={24} color={colors.textHint} />
        </View>
      )}
      <Text style={styles.name} numberOfLines={1}>{facility.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: spacing.md,
    width: 80,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
});
