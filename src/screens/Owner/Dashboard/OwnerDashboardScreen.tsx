import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
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
import Svg, { Circle, Rect, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useAuthStore } from '../../../stores/auth.store';
import { useOwnerDashboardStore } from '../../../stores/owner-dashboard.store';
import { spacing, radius } from '../../../theme/spacing';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatTime } from '../../../utils/date';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - spacing.screenPadding * 2 - spacing.md) / 2;

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatFullDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
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

// ─── SVG Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ values, width = 80, height = 36 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) {
    return (
      <Svg width={width} height={height}>
        <Rect x="0" y={height * 0.6} width={width} height="1.5" rx="1" fill="rgba(0,193,106,0.3)" />
      </Svg>
    );
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height * 0.8) - height * 0.1;
    return `${x},${y}`;
  });
  const d = `M ${pts.join(' L ')}`;
  const fillPts = [
    `0,${height}`,
    ...pts,
    `${width},${height}`,
  ];
  const fillD = `M ${fillPts.join(' L ')} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#00C16A" stopOpacity="0.35" />
          <Stop offset="1" stopColor="#00C16A" stopOpacity="0.0" />
        </SvgGradient>
      </Defs>
      <Path d={fillD} fill="url(#sparkFill)" />
      <Path d={d} stroke="#00C16A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─── SVG Progress Ring ───────────────────────────────────────────────────────

function ProgressRing({
  size = 56,
  progress,
  color,
  bg,
  icon,
  iconColor,
}: {
  size?: number;
  progress: number; // 0–1
  color: string;
  bg: string;
  icon: string;
  iconColor: string;
}) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(1, progress)) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={bg} strokeWidth="5" fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Ionicons name={icon as any} size={size * 0.32} color={iconColor} />
    </View>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection({ name, isDark }: { name: string; isDark: boolean }) {
  const { text: greeting, icon: greetIcon } = getGreeting();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2200 }),
        withTiming(1.0, { duration: 2200 }),
      ),
      -1,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.12,
  }));

  return (
    <LinearGradient
      colors={isDark ? ['#060F28', '#0F2048', '#162B5C'] : ['#0B1A3E', '#132452', '#1A3070']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={heroStyles.container}
    >
      {/* Decorative animated circles */}
      <Animated.View style={[heroStyles.decCircleLarge, pulseStyle]} />
      <View style={heroStyles.decCircleSmall} />
      <View style={heroStyles.decCircleTiny} />

      <View style={heroStyles.content}>
        <View style={heroStyles.topRow}>
          <View>
            <Text style={heroStyles.greeting}>{greetIcon}  {greeting}</Text>
            <Text style={heroStyles.name} numberOfLines={1}>{name}</Text>
          </View>
          <View style={heroStyles.dateBadge}>
            <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.7)" />
            <Text style={heroStyles.dateBadgeText}>
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>
        <Text style={heroStyles.subDate}>{formatFullDate()}</Text>
      </View>
    </LinearGradient>
  );
}

const heroStyles = StyleSheet.create({
  container: {
    borderRadius: 24,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    minHeight: 140,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dateBadgeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  subDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 2,
  },
  decCircleLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    right: -50,
    top: -60,
  },
  decCircleSmall: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.06)',
    right: 40,
    bottom: -20,
  },
  decCircleTiny: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,193,106,0.25)',
    left: 20,
    bottom: 16,
  },
});

// ─── Revenue Card ─────────────────────────────────────────────────────────────

function RevenueCard({
  revenue,
  confirmed,
  trend,
  tc,
  isDark,
}: {
  revenue: number;
  confirmed: number;
  trend: number[];
  tc: any;
  isDark: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(80).springify()}>
      <LinearGradient
        colors={isDark ? ['#0C1832', '#0F2048'] : ['#FFFFFF', '#F8FAF9']}
        style={[revStyles.card, { shadowColor: isDark ? '#000' : '#0B1A3E' }]}
      >
        <View style={revStyles.left}>
          <Text style={[revStyles.label, { color: tc.textHint }]}>Today's Revenue</Text>
          <Text style={[revStyles.amount, { color: tc.textPrimary }]}>
            ${revenue.toLocaleString()}
          </Text>
          <View style={revStyles.pill}>
            <Ionicons name="checkmark-circle" size={12} color="#00C16A" />
            <Text style={revStyles.pillText}>{confirmed} confirmed today</Text>
          </View>
        </View>
        <View style={revStyles.right}>
          <Sparkline values={trend} width={88} height={44} />
          <Text style={[revStyles.trendLabel, { color: tc.textHint }]}>Last 7 bookings</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const revStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  left: { flex: 1, gap: 6 },
  label: { fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },
  amount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,193,106,0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 11, color: '#00C16A', fontWeight: '600' },
  right: { alignItems: 'center', gap: 4 },
  trendLabel: { fontSize: 9, fontWeight: '500' },
});

// ─── Metric Cards ─────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  progress,
  ringColor,
  ringBg,
  ringIcon,
  delay,
  tc,
  isDark,
}: {
  label: string;
  value: number;
  progress: number;
  ringColor: string;
  ringBg: string;
  ringIcon: string;
  delay: number;
  tc: any;
  isDark: boolean;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={{ width: CARD_W }}>
      <View style={[metStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
        <ProgressRing
          size={58}
          progress={progress}
          color={ringColor}
          bg={isDark ? 'rgba(255,255,255,0.06)' : `${ringColor}18`}
          icon={ringIcon}
          iconColor={ringColor}
        />
        <Text style={[metStyles.value, { color: tc.textPrimary }]}>{value}</Text>
        <Text style={[metStyles.label, { color: tc.textHint }]}>{label}</Text>
        <View style={[metStyles.bar, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F2F8' }]}>
          <View style={[metStyles.barFill, { width: `${Math.min(100, progress * 100)}%`, backgroundColor: ringColor }]} />
        </View>
      </View>
    </Animated.View>
  );
}

const metStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  value: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 11, fontWeight: '600', textAlign: 'center', letterSpacing: 0.2 },
  bar: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2 },
});

// ─── Up Next Card ─────────────────────────────────────────────────────────────

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
      <LinearGradient
        colors={isDark ? ['#0C1832', '#112240'] : ['#FFFFFF', '#F0FBF5']}
        style={upStyles.card}
      >
        <View style={upStyles.accentBar} />
        <View style={upStyles.body}>
          <View style={upStyles.topRow}>
            <View style={upStyles.badge}>
              <View style={upStyles.badgeDot} />
              <Text style={upStyles.badgeLabel}>Up Next</Text>
            </View>
            <Text style={upStyles.countdown}>{countdownText}</Text>
          </View>
          <Text style={[upStyles.time, { color: tc.textPrimary }]}>{start}</Text>
          <Text style={[upStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>{userName}</Text>
          <View style={upStyles.meta}>
            <Ionicons name="location-outline" size={12} color={tc.textHint} />
            <Text style={[upStyles.metaText, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
            {end ? (
              <>
                <Text style={[upStyles.sep, { color: tc.textHint }]}>·</Text>
                <Ionicons name="time-outline" size={12} color={tc.textHint} />
                <Text style={[upStyles.metaText, { color: tc.textSecondary }]}>{start} – {end}</Text>
              </>
            ) : null}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const upStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#00C16A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  accentBar: {
    width: 5,
    backgroundColor: '#00C16A',
  },
  body: {
    flex: 1,
    padding: spacing.lg,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00C16A',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00C16A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  countdown: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00C16A',
    backgroundColor: 'rgba(0,193,106,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  time: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  metaText: { fontSize: 12 },
  sep: { fontSize: 12 },
});

// ─── Overview Pills ────────────────────────────────────────────────────────────

function OverviewPills({
  branches,
  venues,
  total,
  tc,
  isDark,
}: {
  branches: number;
  venues: number;
  total: number;
  tc: any;
  isDark: boolean;
}) {
  const pills = [
    { icon: 'business', label: 'Branches', value: branches, color: '#4A90D9' },
    { icon: 'football', label: 'Venues', value: venues, color: '#FF9500' },
    { icon: 'calendar', label: 'All Time', value: total, color: '#9B59B6' },
  ];
  return (
    <Animated.View entering={FadeInDown.delay(300).springify()} style={pillStyles.row}>
      {pills.map((p, i) => (
        <View
          key={p.label}
          style={[pillStyles.pill, {
            backgroundColor: isDark ? '#0C1832' : '#FFFFFF',
            flex: 1,
          }]}
        >
          <View style={[pillStyles.iconBox, { backgroundColor: `${p.color}18` }]}>
            <Ionicons name={p.icon as any} size={16} color={p.color} />
          </View>
          <Text style={[pillStyles.val, { color: tc.textPrimary }]}>{p.value}</Text>
          <Text style={[pillStyles.lbl, { color: tc.textHint }]}>{p.label}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

const pillStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pill: {
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  val: { fontSize: 18, fontWeight: '800' },
  lbl: { fontSize: 10, fontWeight: '600' },
});

// ─── Recent Activity ──────────────────────────────────────────────────────────

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
        <Text style={[actStyles.detail, { color: tc.textSecondary }]} numberOfLines={1}>
          {venueName}{slotTime ? ` · ${slotTime}` : ''}
        </Text>
      </View>
      <View style={[actStyles.statusBadge, { backgroundColor: `${dot}15` }]}>
        <Text style={[actStyles.statusText, { color: dot }]}>{r.status}</Text>
      </View>
    </View>
  );
}

const actStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  info: { flex: 1, gap: 2 },
  user: { fontSize: 13, fontWeight: '600' },
  detail: { fontSize: 11 },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function OwnerDashboardScreen() {
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const user = useAuthStore((s) => s.user);
  const {
    todayConfirmed, todayPending, todayRevenue,
    branchCount, venueCount, reservationCount,
    upcomingToday, recentReservations, revenueTrend,
    fetchDashboardData,
  } = useOwnerDashboardStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, []);

  const total = todayConfirmed + todayPending;
  const confirmedProgress = total > 0 ? todayConfirmed / total : 0;
  const pendingProgress = total > 0 ? todayPending / total : 0;
  const nextUp = upcomingToday[0] ?? null;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: tc.screenBg }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />
        }
      >
        {/* Hero */}
        <Animated.View entering={FadeInUp.delay(0).springify()}>
          <HeroSection name={user?.name || 'Owner'} isDark={isDark} />
        </Animated.View>

        {/* Revenue */}
        <RevenueCard
          revenue={todayRevenue}
          confirmed={todayConfirmed}
          trend={revenueTrend}
          tc={tc}
          isDark={isDark}
        />

        {/* Metric cards row */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.metricsRow}>
          <MetricCard
            label="Confirmed Today"
            value={todayConfirmed}
            progress={confirmedProgress}
            ringColor="#00C16A"
            ringBg={isDark ? 'rgba(0,193,106,0.08)' : 'rgba(0,193,106,0.12)'}
            ringIcon="checkmark"
            delay={160}
            tc={tc}
            isDark={isDark}
          />
          <MetricCard
            label="Pending Today"
            value={todayPending}
            progress={pendingProgress}
            ringColor="#FF9500"
            ringBg={isDark ? 'rgba(255,149,0,0.08)' : 'rgba(255,149,0,0.12)'}
            ringIcon="time"
            delay={200}
            tc={tc}
            isDark={isDark}
          />
        </Animated.View>

        {/* Up Next */}
        {nextUp && (
          <UpNextCard reservation={nextUp} tc={tc} isDark={isDark} />
        )}

        {/* Overview pills */}
        <OverviewPills
          branches={branchCount}
          venues={venueCount}
          total={reservationCount}
          tc={tc}
          isDark={isDark}
        />

        {/* Recent Activity */}
        {recentReservations.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(360).springify()}
            style={[styles.activityCard, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
          >
            <View style={styles.activityHeader}>
              <Text style={[styles.activityTitle, { color: tc.textPrimary }]}>Recent Activity</Text>
              <View style={styles.activityDot} />
            </View>
            {recentReservations.map((r, i) => (
              <React.Fragment key={r.id}>
                <ActivityItem r={r} tc={tc} />
                {i < recentReservations.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F0F2F8' }]} />
                )}
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
  scroll: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  activityCard: {
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C16A',
  },
  divider: {
    height: 0.5,
    marginLeft: 20,
  },
});
