import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { radius, spacing } from '../../../theme/spacing';
import { Branch } from '../../../types/api';

interface FeaturedBranchCardProps {
  branch: Branch;
  onPress: () => void;
}

export function FeaturedBranchCard({ branch, onPress }: FeaturedBranchCardProps) {
  const imageUri = branch.images?.[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="football-outline" size={40} color={colors.textHint} />
        </View>
      )}
      <View style={styles.gradient} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{branch.name}</Text>
        <View style={styles.row}>
          {branch.sport && (
            <View style={styles.pill}>
              <Text style={styles.pillText}>{branch.sport.name}</Text>
            </View>
          )}
          {branch.address && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
              <Text style={styles.locationText}>{branch.address.city}</Text>
            </View>
          )}
        </View>
      </View>
      {branch.isFeatured && (
        <View style={styles.badge}>
          <Ionicons name="star" size={12} color={colors.white} />
          <Text style={styles.badgeText}>Featured</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 280,
    height: 180,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: {
    fontSize: 11,
    color: colors.white,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  badge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },
});
