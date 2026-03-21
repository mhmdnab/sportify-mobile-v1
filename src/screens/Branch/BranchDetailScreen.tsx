import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { ImageCarousel } from '../../components/ui/ImageCarousel';
import { ErrorState } from '../../components/ui/ErrorState';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useBranchesStore } from '../../stores/branches.store';
import { Slot, Venue } from '../../types/api';
import { getDayOfWeek } from '../../utils/date';
import { HomeStackParamList } from '../../types/navigation';
import { DatePicker } from './components/DatePicker';
import { TimeSlotGrid } from './components/TimeSlotGrid';
import { BookingBottomSheet } from './components/BookingBottomSheet';
import { FacilityCard } from './components/FacilityCard';
import { BranchDetailSkeleton } from './components/BranchDetailSkeleton';

type Props = NativeStackScreenProps<HomeStackParamList, 'BranchDetail'>;

export function BranchDetailScreen({ route, navigation }: Props) {
  const { branchId } = route.params;
  const { currentBranch, isLoading, error, fetchBranchById } = useBranchesStore();
  const insets = useSafeAreaInsets();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const bookingSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    fetchBranchById(branchId);
  }, [branchId]);

  const dayOfWeek = getDayOfWeek(selectedDate);

  const availableSlots = useMemo(() => {
    if (!selectedVenue?.availability) return [];
    const dayAvailability = selectedVenue.availability.find(
      (a) => a.day === dayOfWeek && a.isOpen,
    );
    return dayAvailability?.slots || [];
  }, [selectedVenue, dayOfWeek]);

  const handleSlotSelect = (slot: Slot) => {
    setSelectedSlot(slot);
    bookingSheetRef.current?.expand();
  };

  const handleBookingSuccess = (reservationId: number) => {
    bookingSheetRef.current?.close();
    (navigation as any).navigate('BookingsTab', {
      screen: 'ReservationDetail',
      params: { reservationId },
    });
  };

  if (isLoading && !currentBranch) {
    return <BranchDetailSkeleton />;
  }

  if (error || !currentBranch) {
    return <ErrorState message={error || 'Branch not found'} onRetry={() => fetchBranchById(branchId)} />;
  }

  const branch = currentBranch;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ImageCarousel images={branch.images || []} height={260} />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { top: insets.top + 8 }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.name}>{branch.name}</Text>

          <View style={styles.metaRow}>
            {branch.sport && (
              <View style={styles.sportPill}>
                <Text style={styles.sportText}>{branch.sport.name}</Text>
              </View>
            )}
            {branch.address && (
              <View style={styles.meta}>
                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {branch.address.street}, {branch.address.city}
                </Text>
              </View>
            )}
          </View>

          {branch.phone && (
            <View style={styles.meta}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.metaText}>{branch.phone}</Text>
            </View>
          )}

          {/* Facilities */}
          {branch.facilities && branch.facilities.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Facilities</Text>
              <FlatList
                data={branch.facilities}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <FacilityCard facility={item} />}
              />
            </View>
          )}

          {/* Venues & Slots */}
          {branch.venues && branch.venues.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Courts</Text>

              {/* Venue selector */}
              <FlatList
                data={branch.venues}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.venueList}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedVenue(item);
                      setSelectedSlot(null);
                    }}
                    style={[
                      styles.venueTab,
                      selectedVenue?.id === item.id && styles.selectedVenueTab,
                    ]}
                  >
                    <Text
                      style={[
                        styles.venueTabText,
                        selectedVenue?.id === item.id && styles.selectedVenueTabText,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />

              {/* Date picker */}
              <DatePicker selectedDate={selectedDate} onDateSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }} />

              {/* Time slots */}
              {selectedVenue ? (
                <TimeSlotGrid
                  slots={availableSlots}
                  selectedSlotId={selectedSlot?.id || null}
                  onSlotSelect={handleSlotSelect}
                />
              ) : (
                <View style={styles.selectVenueHint}>
                  <Text style={styles.hintText}>Select a court above to see available slots</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <BookingBottomSheet
        ref={bookingSheetRef}
        venue={selectedVenue}
        slot={selectedSlot}
        selectedDate={selectedDate}
        onSuccess={handleBookingSuccess}
      />
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
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  sportPill: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  sportText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  venueList: {
    marginBottom: 4,
  },
  venueTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
  },
  selectedVenueTab: {
    backgroundColor: colors.primary,
  },
  venueTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  selectedVenueTabText: {
    color: colors.white,
  },
  selectVenueHint: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  hintText: {
    fontSize: 14,
    color: colors.textHint,
  },
});
