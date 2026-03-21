import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useReservationsStore } from '../../stores/reservations.store';
import { ReservationStatus } from '../../types/api';
import { formatDate, formatTime } from '../../utils/date';
import { formatPrice } from '../../utils/currency';
import { BookingsStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<BookingsStackParamList, 'ReservationDetail'>;

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: colors.primary,
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: colors.textSecondary,
};

export function ReservationDetailScreen({ route, navigation }: Props) {
  const { reservationId } = route.params;
  const { currentReservation, isLoading, error, fetchReservationById, cancelReservation } = useReservationsStore();

  useEffect(() => {
    fetchReservationById(reservationId);
  }, [reservationId]);

  const handleCancel = () => {
    Alert.alert('Cancel Booking', 'Are you sure you want to cancel this booking?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelReservation(reservationId);
            Alert.alert('Cancelled', 'Your booking has been cancelled.');
          } catch {}
        },
      },
    ]);
  };

  if (isLoading && !currentReservation) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: spacing.screenPadding }}>
          <SkeletonList count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentReservation) {
    return <ErrorState message={error || 'Reservation not found'} onRetry={() => fetchReservationById(reservationId)} />;
  }

  const r = currentReservation;
  const statusColor = statusColors[r.status] || colors.textHint;
  const canCancel = r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{r.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Info</Text>
          <InfoRow label="Booking ID" value={`#${r.id}`} />
          <InfoRow label="Date" value={formatDate(r.slotDate)} />
          {r.slot && (
            <>
              <InfoRow label="Time" value={`${formatTime(r.slot.startTime)} - ${formatTime(r.slot.endTime)}`} />
              <InfoRow label="Price" value={formatPrice(r.slot.price)} highlight />
            </>
          )}
          {r.repeatCount > 0 && <InfoRow label="Repeat Count" value={r.repeatCount.toString()} />}
          {r.notes && <InfoRow label="Notes" value={r.notes} />}
          <InfoRow label="Booked on" value={formatDate(r.createdAt)} />
        </View>

        {r.slot?.availability?.venue && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Venue</Text>
            <InfoRow label="Venue" value={r.slot.availability.venue.name} />
          </View>
        )}

        {canCancel && (
          <View style={styles.cancelSection}>
            <Button title="Cancel Booking" onPress={handleCancel} variant="outline" style={{ borderColor: colors.error }} textStyle={{ color: colors.error }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, highlight && infoStyles.highlight]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  highlight: {
    color: colors.primary,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.xl,
    gap: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  cancelSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
});
