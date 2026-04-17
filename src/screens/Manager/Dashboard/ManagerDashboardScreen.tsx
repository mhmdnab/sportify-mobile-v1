import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useAuthStore } from '../../../stores/auth.store';
import { useManagerDashboardStore } from '../../../stores/manager-dashboard.store';
import { useManagerReservationsStore } from '../../../stores/manager-reservations.store';
import { useNavigation } from '@react-navigation/native';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatTime } from '../../../utils/date';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): { text: string; icon: string } {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', icon: '🌤' };
  return { text: 'Good Evening', icon: '🌙' };
}

function formatAMPM(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

const STATUS_COLOR: Record<ReservationStatus, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: '#00C16A',
  [ReservationStatus.CANCELLED]: '#FF4444',
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
  [ReservationStatus.REJECTED]: '#FF4444',
  [ReservationStatus.COACH_PENDING]: '#F97316',
  [ReservationStatus.COACH_REJECTED]: '#0B1A3E',
};

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ size = 56, progress, color, icon }: { size?: number; progress: number; color: string; icon: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={`${color}20`} strokeWidth="5" fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Ionicons name={icon as any} size={size * 0.32} color={color} />
    </View>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection({ name, isDark }: { name: string; isDark: boolean }) {
  const { text: greeting, icon: greetIcon } = getGreeting();
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.08, { duration: 2200 }), withTiming(1.0, { duration: 2200 })), -1);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 0.12 }));

  return (
    <LinearGradient
      colors={isDark ? ['#060F28', '#0F2048', '#162B5C'] : ['#0B1A3E', '#132452', '#1A3070']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={heroStyles.container}
    >
      <Animated.View style={[heroStyles.decCircle, pulseStyle]} />
      <View style={heroStyles.decSmall} />
      <View style={heroStyles.decTiny} />
      <View style={heroStyles.content}>
        <View style={heroStyles.topRow}>
          <View>
            <Text style={heroStyles.greeting}>{greetIcon}  {greeting}</Text>
            <Text style={heroStyles.name} numberOfLines={1}>{name}</Text>
          </View>
          <View style={heroStyles.roleBadge}>
            <Ionicons name="shield-checkmark" size={11} color="rgba(255,255,255,0.8)" />
            <Text style={heroStyles.roleText}>Manager</Text>
          </View>
        </View>
        <Text style={heroStyles.sub}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </View>
    </LinearGradient>
  );
}
const heroStyles = StyleSheet.create({
  container: { borderRadius: 24, marginBottom: spacing.lg, overflow: 'hidden', minHeight: 130 },
  content: { padding: spacing.xl, paddingBottom: spacing.xl },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500', letterSpacing: 0.3, marginBottom: 4 },
  name: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,193,106,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(0,193,106,0.3)' },
  roleText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  decCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF', right: -50, top: -60 },
  decSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)', right: 40, bottom: -20 },
  decTiny: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,193,106,0.25)', left: 20, bottom: 16 },
});

// ─── Today's Occupancy Card ───────────────────────────────────────────────────

function OccupancyCard({ pending, confirmed, paid, tc, isDark }: { pending: number; confirmed: number; paid: number; tc: any; isDark: boolean }) {
  const total = pending + confirmed + paid;
  const pendingPct = total > 0 ? pending / total : 0;
  const confirmedPct = total > 0 ? confirmed / total : 0;
  const paidPct = total > 0 ? paid / total : 0;

  return (
    <Animated.View entering={FadeInDown.delay(80).springify()}>
      <LinearGradient
        colors={isDark ? ['#0C1832', '#0F2048'] : ['#FFFFFF', '#F8FAF9']}
        style={[occStyles.card, { shadowColor: isDark ? '#000' : '#0B1A3E' }]}
      >
        <View style={occStyles.topRow}>
          <View>
            <Text style={[occStyles.label, { color: tc.textHint }]}>Today's Occupancy</Text>
            <View style={occStyles.totalRow}>
              <Text style={[occStyles.total, { color: tc.textPrimary }]}>{total}</Text>
              <Text style={[occStyles.totalSub, { color: tc.textHint }]}>bookings today</Text>
            </View>
          </View>
          <View style={occStyles.dateBox}>
            <Text style={occStyles.dateDay}>{new Date().getDate()}</Text>
            <Text style={occStyles.dateMonth}>{new Date().toLocaleString('en-US', { month: 'short' })}</Text>
          </View>
        </View>

        {/* Stacked bar */}
        <View style={occStyles.barContainer}>
          <View style={occStyles.barTrack}>
            {confirmedPct > 0 && <View style={[occStyles.barSeg, { flex: confirmedPct, backgroundColor: '#00C16A' }]} />}
            {pendingPct > 0 && <View style={[occStyles.barSeg, { flex: pendingPct, backgroundColor: '#FF9500' }]} />}
            {paidPct > 0 && <View style={[occStyles.barSeg, { flex: paidPct, backgroundColor: '#6B7280' }]} />}
            {total === 0 && <View style={[occStyles.barSeg, { flex: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#ECEDF3' }]} />}
          </View>
        </View>

        {/* Legend */}
        <View style={occStyles.legend}>
          <View style={occStyles.legendItem}>
            <View style={[occStyles.legendDot, { backgroundColor: '#00C16A' }]} />
            <Text style={[occStyles.legendText, { color: tc.textSecondary }]}>{confirmed} Confirmed</Text>
          </View>
          <View style={occStyles.legendItem}>
            <View style={[occStyles.legendDot, { backgroundColor: '#FF9500' }]} />
            <Text style={[occStyles.legendText, { color: tc.textSecondary }]}>{pending} Pending</Text>
          </View>
          <View style={occStyles.legendItem}>
            <View style={[occStyles.legendDot, { backgroundColor: '#6B7280' }]} />
            <Text style={[occStyles.legendText, { color: tc.textSecondary }]}>{paid} Paid</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
const occStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3, marginBottom: 4 },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  total: { fontSize: 38, fontWeight: '900', letterSpacing: -1.5 },
  totalSub: { fontSize: 13, fontWeight: '500' },
  dateBox: { alignItems: 'center', backgroundColor: 'rgba(0,193,106,0.12)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8 },
  dateDay: { fontSize: 22, fontWeight: '900', color: '#00C16A', lineHeight: 26 },
  dateMonth: { fontSize: 11, fontWeight: '700', color: '#00C16A', textTransform: 'uppercase', letterSpacing: 0.5 },
  barContainer: { marginBottom: spacing.md },
  barTrack: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden' },
  barSeg: { height: 8 },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '500' },
});

// ─── Period Cards (Daily / Monthly / Yearly) ──────────────────────────────────

function PeriodCard({ label, value, color, icon, delay, tc, isDark }: { label: string; value: number; color: string; icon: string; delay: number; tc: any; isDark: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[periodStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
      <View style={[periodStyles.iconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[periodStyles.value, { color: tc.textPrimary }]}>{value}</Text>
      <Text style={[periodStyles.label, { color: tc.textHint }]}>{label}</Text>
    </Animated.View>
  );
}
const periodStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: 18, padding: spacing.md, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

// ─── Up Next ──────────────────────────────────────────────────────────────────

function UpNextCard({ reservation, tc, isDark }: { reservation: Reservation; tc: any; isDark: boolean }) {
  const { t } = useTranslation();
  const venueName = reservation.slot?.availability?.venue?.name || t('owner.venue');
  const userName = reservation.user?.name || t('owner.user');
  const start = reservation.slot?.startTime ? formatAMPM(reservation.slot.startTime) : '';
  const end = reservation.slot?.endTime ? formatAMPM(reservation.slot.endTime) : '';
  const startMin = reservation.slot?.startTime ? toMin(reservation.slot.startTime) : 0;
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const minsLeft = startMin - nowMin;
  const countdownText = minsLeft <= 0 ? 'Ongoing' : minsLeft < 60 ? `in ${minsLeft}m` : `in ${Math.floor(minsLeft / 60)}h ${minsLeft % 60}m`;

  return (
    <Animated.View entering={FadeInDown.delay(240).springify()} style={{ marginBottom: spacing.md }}>
      <LinearGradient colors={isDark ? ['#0C1832', '#112240'] : ['#FFFFFF', '#F0FBF5']} style={upStyles.card}>
        <View style={upStyles.accentBar} />
        <View style={upStyles.body}>
          <View style={upStyles.topRow}>
            <View style={upStyles.badge}><View style={upStyles.badgeDot} /><Text style={upStyles.badgeLabel}>Up Next</Text></View>
            <Text style={upStyles.countdown}>{countdownText}</Text>
          </View>
          <Text style={[upStyles.time, { color: tc.textPrimary }]}>{start}</Text>
          <Text style={[upStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>{userName}</Text>
          <View style={upStyles.meta}>
            <Ionicons name="location-outline" size={12} color={tc.textHint} />
            <Text style={[upStyles.metaText, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
            {end ? <><Text style={[upStyles.sep, { color: tc.textHint }]}>·</Text><Ionicons name="time-outline" size={12} color={tc.textHint} /><Text style={[upStyles.metaText, { color: tc.textSecondary }]}>{start} – {end}</Text></> : null}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}
const upStyles = StyleSheet.create({
  card: { borderRadius: 20, flexDirection: 'row', overflow: 'hidden', shadowColor: '#00C16A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  accentBar: { width: 5, backgroundColor: '#00C16A' },
  body: { flex: 1, padding: spacing.lg, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#00C16A' },
  badgeLabel: { fontSize: 11, fontWeight: '700', color: '#00C16A', letterSpacing: 0.5, textTransform: 'uppercase' },
  countdown: { fontSize: 11, fontWeight: '600', color: '#00C16A', backgroundColor: 'rgba(0,193,106,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  time: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 12 },
  sep: { fontSize: 12 },
});

// ─── Peak Hours ───────────────────────────────────────────────────────────────

function PeakHoursCard({ hours, tc, isDark }: { hours: { hour: string; count: number }[]; tc: any; isDark: boolean }) {
  const maxCount = Math.max(...hours.map((h) => h.count), 1);
  return (
    <Animated.View entering={FadeInDown.delay(280).springify()} style={[pkStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
      <Text style={[pkStyles.title, { color: tc.textPrimary }]}>Peak Hours</Text>
      {hours.slice(0, 5).map((h, i) => (
        <View key={h.hour} style={pkStyles.row}>
          <Text style={[pkStyles.hour, { color: tc.textSecondary }]}>{h.hour}</Text>
          <View style={[pkStyles.barBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F2F8' }]}>
            <Animated.View
              entering={FadeInDown.delay(300 + i * 40).springify()}
              style={[pkStyles.barFill, { width: `${(h.count / maxCount) * 100}%`, backgroundColor: `rgba(0,193,106,${0.4 + (h.count / maxCount) * 0.6})` }]}
            />
          </View>
          <Text style={[pkStyles.count, { color: tc.textHint }]}>{h.count}</Text>
        </View>
      ))}
    </Animated.View>
  );
}
const pkStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  hour: { width: 44, fontSize: 12, fontWeight: '600' },
  barBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  count: { width: 24, fontSize: 11, textAlign: 'right' },
});

// ─── Top Venues ───────────────────────────────────────────────────────────────

function TopVenuesCard({ venues, tc, isDark }: { venues: { venueId: number; venueName: string; count: number }[]; tc: any; isDark: boolean }) {
  const venueColors = ['#00C16A', '#4A90D9', '#FF9500'];
  return (
    <Animated.View entering={FadeInDown.delay(320).springify()} style={[tvStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
      <Text style={[tvStyles.title, { color: tc.textPrimary }]}>Top Venues</Text>
      {venues.slice(0, 3).map((v, i) => (
        <View key={v.venueId} style={tvStyles.row}>
          <View style={[tvStyles.rank, { backgroundColor: `${venueColors[i] || '#888'}20` }]}>
            <Text style={[tvStyles.rankNum, { color: venueColors[i] || '#888' }]}>#{i + 1}</Text>
          </View>
          <Text style={[tvStyles.venueName, { color: tc.textPrimary }]} numberOfLines={1}>{v.venueName}</Text>
          <View style={[tvStyles.countBadge, { backgroundColor: `${venueColors[i] || '#888'}15` }]}>
            <Text style={[tvStyles.countText, { color: venueColors[i] || '#888' }]}>{v.count}</Text>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}
const tvStyles = StyleSheet.create({
  card: { borderRadius: 20, padding: spacing.lg, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rank: { width: 36, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankNum: { fontSize: 11, fontWeight: '800' },
  venueName: { flex: 1, fontSize: 13, fontWeight: '600' },
  countBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 12, fontWeight: '700' },
});

// ─── Activity Feed ────────────────────────────────────────────────────────────

function ActivityItem({ r, tc }: { r: Reservation; tc: any }) {
  const { t } = useTranslation();
  const dot = STATUS_COLOR[r.status] ?? tc.textHint;
  const venueName = r.slot?.availability?.venue?.name || t('owner.venue');
  const userName = r.user?.name || t('owner.user');
  const slotTime = r.slot ? `${formatTime(r.slot.startTime)} – ${formatTime(r.slot.endTime)}` : '';
  return (
    <View style={actStyles.row}>
      <View style={[actStyles.dot, { backgroundColor: dot }]} />
      <View style={actStyles.info}>
        <Text style={[actStyles.user, { color: tc.textPrimary }]} numberOfLines={1}>{userName}</Text>
        <Text style={[actStyles.detail, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}{slotTime ? ` · ${slotTime}` : ''}</Text>
      </View>
      <View style={[actStyles.badge, { backgroundColor: `${dot}15` }]}>
        <Text style={[actStyles.badgeText, { color: dot }]}>{r.status}</Text>
      </View>
    </View>
  );
}
const actStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1, gap: 2 },
  user: { fontSize: 13, fontWeight: '600' },
  detail: { fontSize: 11 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ManagerDashboardScreen() {
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const { setPendingFilter } = useManagerReservationsStore();
  const {
    daily, monthly, yearly,
    peakHours, peakVenues,
    todayConfirmed, todayPending, todayPaid,
    upcomingToday, recentReservations,
    fetchDashboardData,
  } = useManagerDashboardStore();
  const [refreshing, setRefreshing] = useState(false);

  const goToAllReservations = () => {
    setPendingFilter('all');
    navigation.getParent()?.navigate('ManagerReservationsTab');
  };

  useEffect(() => { fetchDashboardData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const nextUp = upcomingToday[0] ?? null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />}
      >
        {/* Hero */}
        <Animated.View entering={FadeInUp.delay(0).springify()}>
          <HeroSection name={user?.name || 'Manager'} isDark={isDark} />
        </Animated.View>

        {/* Today's Occupancy */}
        <OccupancyCard pending={todayPending} confirmed={todayConfirmed} paid={todayPaid} tc={tc} isDark={isDark} />

        {/* Today's breakdown cards */}
        <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.periodRow}>
          <PeriodCard label="Pending" value={todayPending} color="#FF9500" icon="time" delay={140} tc={tc} isDark={isDark} />
          <PeriodCard label="Confirmed" value={todayConfirmed} color="#00C16A" icon="checkmark-circle" delay={170} tc={tc} isDark={isDark} />
          <PeriodCard label="Paid" value={todayPaid} color="#6B7280" icon="cash" delay={200} tc={tc} isDark={isDark} />
        </Animated.View>

        {/* Up Next */}
        {nextUp && <UpNextCard reservation={nextUp} tc={tc} isDark={isDark} />}

        {/* Peak Hours */}
        {peakHours.length > 0 && <PeakHoursCard hours={peakHours} tc={tc} isDark={isDark} />}

        {/* Top Venues */}
        {peakVenues.length > 0 && <TopVenuesCard venues={peakVenues} tc={tc} isDark={isDark} />}

        {/* Recent Activity */}
        {recentReservations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(360).springify()} style={[styles.actCard, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
            <View style={styles.actHeader}>
              <Text style={[styles.actTitle, { color: tc.textPrimary }]}>Recent Activity</Text>
              <TouchableOpacity onPress={goToAllReservations} style={styles.showAllBtn}>
                <Text style={styles.showAllText}>Show All</Text>
                <Ionicons name="chevron-forward" size={12} color="#00C16A" />
              </TouchableOpacity>
            </View>
            {recentReservations.map((r, i) => (
              <React.Fragment key={r.id}>
                <ActivityItem r={r} tc={tc} />
                {i < recentReservations.length - 1 && <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F2F8' }]} />}
              </React.Fragment>
            ))}
          </Animated.View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.screenPadding, paddingTop: spacing.md },
  periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actCard: { borderRadius: 20, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: spacing.md },
  actHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.sm, marginBottom: spacing.sm },
  actTitle: { fontSize: 15, fontWeight: '700' },
  showAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  showAllText: { fontSize: 12, fontWeight: '700', color: '#00C16A' },
  divider: { height: 0.5, marginLeft: 20 },
});
