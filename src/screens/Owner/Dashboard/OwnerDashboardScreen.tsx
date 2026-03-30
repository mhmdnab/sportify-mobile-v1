import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useAuthStore } from '../../../stores/auth.store';
import { useOwnerDashboardStore } from '../../../stores/owner-dashboard.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate, formatTime } from '../../../utils/date';

function StatCard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  tc,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  tc: any;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: tc.cardBg }]}>
      <View style={[statStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={[statStyles.value, { color: tc.textPrimary }]}>{value}</Text>
      <Text style={[statStyles.label, { color: tc.textSecondary }]}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});

const statusColors: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: colors.navy,
  [ReservationStatus.CANCELLED]: colors.error,
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: colors.textSecondary,
};

function RecentReservationItem({ reservation, tc }: { reservation: Reservation; tc: any }) {
  const statusColor = statusColors[reservation.status] || colors.textHint;
  const { t } = useTranslation();
  const venueName = reservation.slot?.availability?.venue?.name || t('owner.venue');
  const slotTime = reservation.slot
    ? `${formatTime(reservation.slot.startTime)} - ${formatTime(reservation.slot.endTime)}`
    : '';

  return (
    <View style={[recentStyles.item, { backgroundColor: tc.cardBg }]}>
      <View style={[recentStyles.statusDot, { backgroundColor: statusColor }]} />
      <View style={recentStyles.info}>
        <Text style={[recentStyles.venue, { color: tc.textPrimary }]} numberOfLines={1}>
          {venueName}
        </Text>
        <Text style={[recentStyles.details, { color: tc.textSecondary }]}>
          {formatDate(reservation.slotDate)} {slotTime ? `· ${slotTime}` : ''}
        </Text>
      </View>
      <View style={[recentStyles.badge, { backgroundColor: `${statusColor}15` }]}>
        <Text style={[recentStyles.badgeText, { color: statusColor }]}>
          {reservation.status}
        </Text>
      </View>
    </View>
  );
}

const recentStyles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  venue: {
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    fontSize: 12,
  },
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

export function OwnerDashboardScreen() {
  const { t } = useTranslation();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const user = useAuthStore((s) => s.user);
  const { branchCount, venueCount, reservationCount, recentReservations, isLoading, fetchDashboardData } =
    useOwnerDashboardStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />}
      >
        {/* Welcome Card */}
        <View style={[styles.welcomeCard, { backgroundColor: isDark ? colors.navyLight : colors.navy }]}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeGreeting}>
              {t('owner.welcomeBack')}
            </Text>
            <Text style={styles.welcomeName} numberOfLines={1}>
              {user?.name || t('owner.owner')}
            </Text>
            <Text style={styles.welcomeSub}>
              {t('owner.manageDescription')}
            </Text>
          </View>
          <View style={styles.welcomeIconWrap}>
            <Ionicons name="fitness" size={48} color="rgba(255,255,255,0.2)" />
          </View>
        </View>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{t('owner.overview')}</Text>
        <View style={styles.statsRow}>
          <StatCard
            icon="business"
            iconColor="#4A90D9"
            iconBg={isDark ? 'rgba(74,144,217,0.15)' : 'rgba(74,144,217,0.1)'}
            label={t('owner.branches')}
            value={branchCount}
            tc={tc}
          />
          <StatCard
            icon="football"
            iconColor="#FF9500"
            iconBg={isDark ? 'rgba(255,149,0,0.15)' : 'rgba(255,149,0,0.1)'}
            label={t('owner.venuesPlural')}
            value={venueCount}
            tc={tc}
          />
          <StatCard
            icon="calendar"
            iconColor="#00C16A"
            iconBg={isDark ? 'rgba(0,193,106,0.15)' : 'rgba(0,193,106,0.1)'}
            label={t('owner.bookings')}
            value={reservationCount}
            tc={tc}
          />
        </View>

        {/* Recent Reservations */}
        {recentReservations.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary, marginTop: spacing.xl }]}>
              {t('owner.recentBookings')}
            </Text>
            {recentReservations.map((r) => (
              <RecentReservationItem key={r.id} reservation={r} tc={tc} />
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: spacing.screenPadding,
  },
  welcomeCard: {
    borderRadius: radius.card,
    padding: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  welcomeName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  welcomeSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  welcomeIconWrap: {
    marginLeft: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
