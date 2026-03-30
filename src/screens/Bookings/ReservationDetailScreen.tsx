import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ui/ErrorState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { spacing } from '../../theme/spacing';
import { useReservationsStore } from '../../stores/reservations.store';
import { ReservationStatus } from '../../types/api';
import { formatDate, formatTime } from '../../utils/date';
import { formatPrice } from '../../utils/currency';
import { BookingsStackParamList } from '../../types/navigation';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { useThemeStore } from '../../stores/theme.store';
import { useTranslation } from 'react-i18next';

type Props = NativeStackScreenProps<BookingsStackParamList, 'ReservationDetail'>;

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: colors.navy,
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.REJECTED]: '#FF3B30',
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: colors.textSecondary,
};

export function ReservationDetailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { reservationId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { currentReservation, isLoading, error, fetchReservationById, cancelReservation } = useReservationsStore();

  useEffect(() => {
    fetchReservationById(reservationId);
  }, [reservationId]);

  const handleCancel = () => {
    Alert.alert(t('bookings.cancelBooking'), t('bookings.cancelBookingConfirm'), [
      { text: t('bookings.no'), style: 'cancel' },
      {
        text: t('bookings.yesCancel'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelReservation(reservationId);
            Alert.alert(t('bookings.cancelled'), t('bookings.bookingCancelled'));
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
    return <ErrorState message={error || t('bookings.notFound')} onRetry={() => fetchReservationById(reservationId)} />;
  }

  const r = currentReservation;
  const statusColor = statusColors[r.status] || colors.textHint;
  const canCancel = r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{t('bookings.bookingDetails')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{r.status}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{t('bookings.bookingInfo')}</Text>
          <InfoRow label={t('bookings.bookingId')} value={`#${r.id}`} />
          <InfoRow label={t('bookings.date')} value={formatDate(r.slotDate)} />
          {r.slot && (
            <>
              <InfoRow label={t('bookings.time')} value={`${formatTime(r.slot.startTime)} - ${formatTime(r.slot.endTime)}`} />
              <InfoRow label={t('bookings.price')} value={formatPrice(r.slot.price)} highlight />
            </>
          )}
          {r.repeatCount > 0 && <InfoRow label={t('bookings.repeatCount')} value={r.repeatCount.toString()} />}
          {r.notes && <InfoRow label={t('bookings.notes')} value={r.notes} />}
          <InfoRow label={t('bookings.bookedOn')} value={formatDate(r.createdAt)} />
        </View>

        {r.slot?.availability?.venue && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{t('bookings.venue')}</Text>
            <InfoRow label={t('bookings.venue')} value={r.slot.availability.venue.name} />
          </View>
        )}

        {canCancel && (
          <View style={styles.cancelSection}>
            <Button title={t('bookings.cancelBooking')} onPress={handleCancel} variant="outline" style={{ borderColor: colors.error }} textStyle={{ color: colors.error }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  const tc = useThemeColors();
  return (
    <View style={[infoStyles.row, { borderBottomColor: tc.border }]}>
      <Text style={[infoStyles.label, { color: tc.textSecondary }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: tc.textPrimary }, highlight && infoStyles.highlight]}>{value}</Text>
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
    color: colors.navy,
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
