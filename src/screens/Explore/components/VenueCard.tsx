import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { radius, spacing } from '../../../theme/spacing';
import { Venue } from '../../../types/api';

interface VenueCardProps {
  venue: Venue;
  onPress: () => void;
}

export function VenueCard({ venue, onPress }: VenueCardProps) {
  const imageUri = venue.images?.[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <Ionicons name="football-outline" size={28} color={colors.textHint} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{venue.name}</Text>
        {venue.branch && (
          <Text style={styles.branch} numberOfLines={1}>{venue.branch.name}</Text>
        )}
        <View style={styles.row}>
          <View style={styles.detail}>
            <Ionicons name="people-outline" size={14} color={colors.textHint} />
            <Text style={styles.detailText}>{venue.playerCapacity} players</Text>
          </View>
          {venue.venueTypes && venue.venueTypes.length > 0 && (
            <View style={styles.typePill}>
              <Text style={styles.typeText}>{venue.venueTypes[0].name}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textHint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: radius.input,
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  branch: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: colors.textHint,
  },
  typePill: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
