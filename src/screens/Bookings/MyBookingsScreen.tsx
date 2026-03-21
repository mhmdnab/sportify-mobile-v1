import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useReservationsStore } from '../../stores/reservations.store';
import { Reservation, ReservationStatus } from '../../types/api';
import { BookingsStackParamList } from '../../types/navigation';
import { ReservationCard } from './components/ReservationCard';
import { BookingsSkeleton } from './components/BookingsSkeleton';

type Nav = NativeStackNavigationProp<BookingsStackParamList, 'MyBookings'>;

type Tab = 'upcoming' | 'past';

export function MyBookingsScreen() {
  const navigation = useNavigation<Nav>();
  const { reservations, isLoading, error, fetchOwnReservations } = useReservationsStore();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOwnReservations();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOwnReservations();
    setRefreshing(false);
  };

  const now = new Date();
  const upcoming = reservations.filter((r) => {
    const isPending = r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED;
    return isPending;
  });
  const past = reservations.filter((r) => {
    const isDone = r.status === ReservationStatus.CANCELLED || r.status === ReservationStatus.PLAYED || r.status === ReservationStatus.PAID;
    return isDone;
  });

  const data = activeTab === 'upcoming' ? upcoming : past;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>My Bookings</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('upcoming')}
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('past')}
          style={[styles.tab, activeTab === 'past' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.activeTabText]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading && reservations.length === 0 ? (
        <BookingsSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOwnReservations} />
      ) : data.length === 0 ? (
        <EmptyState
          icon="calendar-outline"
          title={activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          message="Your bookings will appear here"
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <ReservationCard
              reservation={item}
              onPress={() => navigation.navigate('ReservationDetail', { reservationId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: 12,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textHint,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
  },
});
