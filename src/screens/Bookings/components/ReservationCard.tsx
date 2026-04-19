import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { radius, spacing } from '../../../theme/spacing';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

interface ReservationCardProps {
  reservation: Reservation;
  onPress: () => void;
}

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: '#3B82F6',
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.REJECTED]: '#FF3B30',
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: colors.textSecondary,
  [ReservationStatus.COACH_PENDING]: '#F97316',
  [ReservationStatus.COACH_REJECTED]: '#EF4444',
  [ReservationStatus.EXPIRED]: '#9CA3AF',
};

export function ReservationCard({ reservation, onPress }: ReservationCardProps) {
  const tc = useThemeColors();
  const statusColor = statusColors[reservation.status] || colors.textHint;
  const venueName = reservation.slot?.availability?.venue?.name || 'Venue';
  const slotTime = reservation.slot
    ? `${formatTime(reservation.slot.startTime)} - ${formatTime(reservation.slot.endTime)}`
    : '';

  const venuePrice = reservation.slot?.price ?? 0;
  const slotDurationHours = (() => {
    if (!reservation.slot?.startTime || !reservation.slot?.endTime) return 1;
    const [sh, sm] = (reservation.slot.startTime as string).split(':').map(Number);
    const [eh, em] = (reservation.slot.endTime as string).split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
  })();
  const coachFee = reservation.withCoach && reservation.coachRate
    ? reservation.coachRate * slotDurationHours
    : 0;
  const total = venuePrice + coachFee;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.container, { backgroundColor: tc.cardBg }]}>
      <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.venue, { color: tc.textPrimary }]} numberOfLines={1}>{venueName}</Text>
          <View style={[styles.badge, { backgroundColor: `${statusColor}15` }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {reservation.status}
            </Text>
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={tc.textHint} />
            <Text style={[styles.detailText, { color: tc.textSecondary }]}>{formatDate(reservation.slotDate)}</Text>
          </View>
          {slotTime && (
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={14} color={tc.textHint} />
              <Text style={[styles.detailText, { color: tc.textSecondary }]}>{slotTime}</Text>
            </View>
          )}
          {total > 0 && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={14} color={tc.textHint} />
              <Text style={styles.priceText}>
                {formatPrice(total)}
                {reservation.withCoach ? ' (with coach)' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={tc.textHint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.card,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  statusBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  venue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  details: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  priceText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
});
