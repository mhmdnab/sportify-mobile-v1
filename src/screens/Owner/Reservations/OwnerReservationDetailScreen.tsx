import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useOwnerReservationsStore } from '../../../stores/owner-reservations.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { OwnerReservationsStackParamList } from '../../../types/navigation';
import { ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';
import { formatPrice } from '../../../utils/currency';

type RouteParams = RouteProp<OwnerReservationsStackParamList, 'OwnerReservationDetail'>;

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: colors.navy,
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
};

const statusActions: { from: ReservationStatus; to: ReservationStatus; labelKey: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { from: ReservationStatus.PENDING, to: ReservationStatus.CONFIRMED, labelKey: 'owner.confirmAction', icon: 'checkmark-circle' },
  { from: ReservationStatus.CONFIRMED, to: ReservationStatus.PLAYED, labelKey: 'owner.markPlayed', icon: 'football' },
  { from: ReservationStatus.PLAYED, to: ReservationStatus.PAID, labelKey: 'owner.markPaid', icon: 'cash' },
];

export function OwnerReservationDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { reservationId } = route.params;
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const {
    currentReservation: reservation,
    isLoadingDetail,
    fetchReservationById,
    updateReservationStatus,
  } = useOwnerReservationsStore();
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchReservationById(reservationId);
  }, [reservationId]);

  const handleStatusUpdate = async (status: ReservationStatus) => {
    setUpdating(true);
    try {
      await updateReservationStatus(reservationId, status);
      await fetchReservationById(reservationId);
    } catch (error: any) {
      Alert.alert(t('owner.error'), error?.message || t('owner.failedUpdateStatus'));
    }
    setUpdating(false);
  };

  const handleCancel = () => {
    Alert.alert(t('owner.cancelReservation'), t('owner.cancelReservationConfirm'), [
      { text: t('owner.no'), style: 'cancel' },
      {
        text: t('owner.yesCancel'),
        style: 'destructive',
        onPress: () => handleStatusUpdate(ReservationStatus.CANCELLED),
      },
    ]);
  };

  if (isLoadingDetail || !reservation) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
        <ActivityIndicator size="large" color={colors.navy} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const statusColor = statusColors[reservation.status] || colors.textHint;
  const venueName = reservation.slot?.availability?.venue?.name || t('owner.venue');
  const userName = reservation.user?.name || t('owner.user');
  const userEmail = reservation.user?.email || '';
  const slotTime = reservation.slot
    ? `${formatTime(reservation.slot.startTime)} - ${formatTime(reservation.slot.endTime)}`
    : '-';

  const nextAction = statusActions.find((a) => a.from === reservation.status);
  const canCancel =
    reservation.status === ReservationStatus.PENDING ||
    reservation.status === ReservationStatus.CONFIRMED;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>{t('owner.reservation')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${statusColor}15` }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>{reservation.status}</Text>
        </View>

        {/* Customer Info */}
        <View style={[styles.card, { backgroundColor: tc.cardBg }]}>
          <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>{t('owner.customer')}</Text>
          <InfoRow icon="person-outline" value={userName} tc={tc} />
          {userEmail ? <InfoRow icon="mail-outline" value={userEmail} tc={tc} /> : null}
        </View>

        {/* Booking Info */}
        <View style={[styles.card, { backgroundColor: tc.cardBg }]}>
          <Text style={[styles.cardTitle, { color: tc.textPrimary }]}>{t('owner.bookings')}</Text>
          <InfoRow icon="football-outline" value={venueName} tc={tc} />
          <InfoRow icon="calendar-outline" value={formatDate(reservation.slotDate)} tc={tc} />
          <InfoRow icon="time-outline" value={slotTime} tc={tc} />
          {reservation.slot?.price ? (
            <InfoRow icon="cash-outline" value={formatPrice(reservation.slot.price)} tc={tc} highlight />
          ) : null}
          {reservation.notes ? (
            <InfoRow icon="chatbubble-outline" value={reservation.notes} tc={tc} />
          ) : null}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {nextAction && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: isDark ? colors.navyLight : colors.navy }]}
              onPress={() => handleStatusUpdate(nextAction.to)}
              disabled={updating}
            >
              <Ionicons name={nextAction.icon} size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>
                {updating ? t('owner.updating') : t(nextAction.labelKey)}
              </Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={handleCancel}
              disabled={updating}
            >
              <Ionicons name="close-circle" size={18} color="#FF4444" />
              <Text style={[styles.actionBtnText, { color: '#FF4444' }]}>{t('owner.cancel')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  value,
  tc,
  highlight,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  tc: any;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={tc.textHint} />
      <Text
        style={[
          styles.infoValue,
          { color: highlight ? colors.navy : tc.textPrimary },
          highlight && { fontWeight: '700' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.screenPadding,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.button,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,68,68,0.1)',
  },
});
