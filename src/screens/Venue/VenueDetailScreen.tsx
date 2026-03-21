import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageCarousel } from '../../components/ui/ImageCarousel';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonCard, SkeletonList } from '../../components/ui/Skeleton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useVenuesStore } from '../../stores/venues.store';
import { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'VenueDetail'>;

export function VenueDetailScreen({ route, navigation }: Props) {
  const { venueId } = route.params;
  const { currentVenue, isLoading, error, fetchVenueById } = useVenuesStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchVenueById(venueId);
  }, [venueId]);

  if (isLoading && !currentVenue) {
    return (
      <View style={styles.container}>
        <SkeletonCard />
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonList count={3} />
        </View>
      </View>
    );
  }

  if (error || !currentVenue) {
    return <ErrorState message={error || 'Venue not found'} onRetry={() => fetchVenueById(venueId)} />;
  }

  const venue = currentVenue;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageCarousel images={venue.images || []} height={280} />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { top: insets.top + 8 }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.name}>{venue.name}</Text>

          <View style={styles.metaRow}>
            <View style={styles.meta}>
              <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{venue.playerCapacity} players</Text>
            </View>
            {venue.branch?.address && (
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.metaText}>{venue.branch.address.city}</Text>
              </View>
            )}
          </View>

          {venue.venueTypes && venue.venueTypes.length > 0 && (
            <View style={styles.chips}>
              {venue.venueTypes.map((type) => (
                <Chip key={type.id} label={type.name} />
              ))}
            </View>
          )}

          {venue.branch && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Branch</Text>
              <TouchableOpacity
                style={styles.branchCard}
                onPress={() => navigation.navigate('BranchDetail', { branchId: venue.branch!.id })}
              >
                <View style={styles.branchInfo}>
                  <Text style={styles.branchName}>{venue.branch.name}</Text>
                  {venue.branch.sport && (
                    <Text style={styles.branchSport}>{venue.branch.sport.name}</Text>
                  )}
                  {venue.branch.address && (
                    <Text style={styles.branchAddress}>
                      {venue.branch.address.street}, {venue.branch.address.city}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textHint} />
              </TouchableOpacity>
            </View>
          )}

          {venue.availability && venue.availability.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              {venue.availability
                .filter((a) => a.isOpen)
                .map((a) => (
                  <View key={a.id} style={styles.availabilityRow}>
                    <Text style={styles.dayText}>
                      {a.day.charAt(0) + a.day.slice(1).toLowerCase()}
                    </Text>
                    <Text style={styles.timeText}>
                      {a.startTime} - {a.endTime}
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      </ScrollView>

      {venue.branch && (
        <View style={[styles.stickyBottom, { paddingBottom: insets.bottom || spacing.lg }]}>
          <Button
            title="View Branch & Book"
            onPress={() => navigation.navigate('BranchDetail', { branchId: venue.branch!.id })}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  content: {
    padding: spacing.screenPadding,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  branchSport: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 13,
    color: colors.textHint,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  timeText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  stickyBottom: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
