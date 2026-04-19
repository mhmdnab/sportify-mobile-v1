import React, { useEffect, useCallback } from 'react';
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
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { Ionicons, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../stores/auth.store';
import { useCoachDashboardStore } from '../../../stores/coach-dashboard.store';
import { useUIStore } from '../../../stores/ui.store';
import { useNotificationsStore } from '../../../stores/notifications.store';
import { useReservationsStore } from '../../../stores/reservations.store';
import { useThemeStore } from '../../../stores/theme.store';
import { useThemeColors } from '../../../theme/useThemeColors';
import { spacing } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatDate } from '../../../utils/date';
import { colors } from '../../../theme/colors';
import { radius } from '../../../theme/spacing';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', icon: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', icon: '🌤' };
  return { text: 'Good Evening', icon: '🌙' };
}

function formatAMPM(t: string) {
  const [h, m] = t.split(':').map(Number);
  const p = h >= 12 ? 'PM' : 'AM';
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
}

const STATUS_COLOR: Record<string, string> = {
  [ReservationStatus.PENDING]: '#FF9500',
  [ReservationStatus.CONFIRMED]: '#00C16A',
  [ReservationStatus.CANCELLED]: '#FF4444',
  [ReservationStatus.PLAYED]: '#007AFF',
  [ReservationStatus.PAID]: '#6B7280',
  [ReservationStatus.REJECTED]: '#FF4444',
  [ReservationStatus.COACH_PENDING]: '#FF9500',
  [ReservationStatus.COACH_REJECTED]: '#FF4444',
};

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
      <View style={heroStyles.content}>
        <View style={heroStyles.topRow}>
          <View>
            <Text style={heroStyles.greeting}>{greetIcon}  {greeting}</Text>
            <Text style={heroStyles.name} numberOfLines={1}>{name}</Text>
          </View>
          <View style={heroStyles.roleBadge}>
            <FontAwesome6 name="people-group" size={10} color="rgba(255,255,255,0.8)" />
            <Text style={heroStyles.roleText}>Coach</Text>
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
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(11,26,62,0.25)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(11,26,62,0.4)' },
  roleText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  sub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
  decCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFFFFF', right: -50, top: -60 },
  decSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)', right: 40, bottom: -20 },
});

function RevenueCard({ earnings, isDark, tc }: { earnings: { total: number; thisMonth: number; thisWeek: number; sessionCount: number }; isDark: boolean; tc: any }) {
  const accentColor = isDark ? '#A2B8FF' : colors.navy;
  return (
    <Animated.View entering={FadeInDown.delay(80).springify()} style={{ marginBottom: spacing.md }}>
      <LinearGradient
        colors={isDark ? ['#0C1832', '#0F2048'] : ['#FFFFFF', '#F0F4FF']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={revStyles.card}
      >
        <View style={revStyles.top}>
          <View style={[revStyles.iconBox, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.08)' }]}>
            <Ionicons name="wallet-outline" size={20} color={accentColor} />
          </View>
          <View style={revStyles.sessionPill}>
            <Text style={[revStyles.sessionText, { color: isDark ? 'rgba(162,184,255,0.7)' : 'rgba(11,26,62,0.5)' }]}>{earnings.sessionCount} sessions</Text>
          </View>
        </View>
        <Text style={[revStyles.totalLabel, { color: isDark ? 'rgba(162,184,255,0.55)' : 'rgba(11,26,62,0.45)' }]}>Total Earnings</Text>
        <Text style={[revStyles.total, { color: accentColor }]}>${earnings.total.toFixed(0)}</Text>
        <View style={revStyles.pillsRow}>
          <View style={[revStyles.pill, { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : 'rgba(11,26,62,0.06)' }]}>
            <Text style={[revStyles.pillLabel, { color: isDark ? 'rgba(162,184,255,0.55)' : 'rgba(11,26,62,0.45)' }]}>This Month</Text>
            <Text style={[revStyles.pillValue, { color: accentColor }]}>${earnings.thisMonth.toFixed(0)}</Text>
          </View>
          <View style={[revStyles.pill, { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : 'rgba(11,26,62,0.06)' }]}>
            <Text style={[revStyles.pillLabel, { color: isDark ? 'rgba(162,184,255,0.55)' : 'rgba(11,26,62,0.45)' }]}>This Week</Text>
            <Text style={[revStyles.pillValue, { color: accentColor }]}>${earnings.thisWeek.toFixed(0)}</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const revStyles = StyleSheet.create({
  card: { borderRadius: 22, padding: spacing.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sessionPill: {},
  sessionText: { fontSize: 12, fontWeight: '600' },
  totalLabel: { fontSize: 12, fontWeight: '500', marginBottom: 2 },
  total: { fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: spacing.sm },
  pillsRow: { flexDirection: 'row', gap: 10 },
  pill: { flex: 1, borderRadius: 12, padding: 10 },
  pillLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  pillValue: { fontSize: 18, fontWeight: '800' },
});

function MetricCard({ label, value, color, icon, delay, tc, isDark }: { label: string; value: number; color: string; icon: string; delay: number; tc: any; isDark: boolean }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={[metricStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
      <View style={[metricStyles.iconBox, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[metricStyles.value, { color: tc.textPrimary }]}>{value}</Text>
      <Text style={[metricStyles.label, { color: tc.textHint }]}>{label}</Text>
    </Animated.View>
  );
}

const metricStyles = StyleSheet.create({
  card: { flex: 1, borderRadius: 18, padding: spacing.md, alignItems: 'center', gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
});

function UpNextCard({ reservation, tc, isDark }: { reservation: Reservation; tc: any; isDark: boolean }) {
  const venueName = reservation.slot?.availability?.venue?.name ?? 'Venue';
  const userName = reservation.user?.name ?? 'Client';
  const start = reservation.slot?.startTime ? formatAMPM(reservation.slot.startTime) : '';
  const end = reservation.slot?.endTime ? formatAMPM(reservation.slot.endTime) : '';

  return (
    <Animated.View entering={FadeInDown.delay(240).springify()} style={{ marginBottom: spacing.md }}>
      <LinearGradient colors={isDark ? ['#0C1832', '#112240'] : ['#FFFFFF', '#F0FBF5']} style={upStyles.card}>
        <View style={[upStyles.accentBar, { backgroundColor: isDark ? '#3B82F6' : '#0B1A3E' }]} />
        <View style={upStyles.body}>
          <View style={upStyles.badge}>
            <View style={[upStyles.badgeDot, { backgroundColor: isDark ? '#3B82F6' : '#0B1A3E' }]} />
            <Text style={[upStyles.badgeLabel, { color: isDark ? '#7FAFD6' : '#0B1A3E' }]}>Up Next</Text>
          </View>
          <Text style={[upStyles.time, { color: tc.textPrimary }]}>{start}</Text>
          <Text style={[upStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>{userName}</Text>
          <View style={upStyles.meta}>
            <Ionicons name="location-outline" size={12} color={tc.textHint} />
            <Text style={[upStyles.metaText, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
            {end ? <><Text style={{ color: tc.textHint }}> · </Text><Text style={[upStyles.metaText, { color: tc.textSecondary }]}>{start} – {end}</Text></> : null}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const upStyles = StyleSheet.create({
  card: { borderRadius: 20, flexDirection: 'row', overflow: 'hidden' },
  accentBar: { width: 5, backgroundColor: '#0B1A3E' },
  body: { flex: 1, padding: spacing.lg, gap: 5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  badgeDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#0B1A3E' },
  badgeLabel: { fontSize: 11, fontWeight: '700', color: '#0B1A3E', letterSpacing: 0.5, textTransform: 'uppercase' },
  time: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 12 },
});

function ActivityItem({ reservation, tc, isDark }: { reservation: Reservation; tc: any; isDark: boolean }) {
  const venueName = reservation.slot?.availability?.venue?.name ?? '—';
  const userName = reservation.user?.name ?? '—';
  const dotColor = STATUS_COLOR[reservation.status] ?? '#888';
  return (
    <View style={[actStyles.row, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#F0F0F8' }]}>
      <View style={[actStyles.dot, { backgroundColor: dotColor }]} />
      <View style={actStyles.info}>
        <Text style={[actStyles.user, { color: tc.textPrimary }]} numberOfLines={1}>{userName}</Text>
        <Text style={[actStyles.venue, { color: tc.textSecondary }]} numberOfLines={1}>{venueName}</Text>
      </View>
      <View style={[actStyles.badge, { backgroundColor: `${dotColor}18` }]}>
        <Text style={[actStyles.badgeText, { color: dotColor }]}>{reservation.status.replace('_', ' ')}</Text>
      </View>
    </View>
  );
}
const actStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  info: { flex: 1 },
  user: { fontSize: 13, fontWeight: '600' },
  venue: { fontSize: 11, marginTop: 1 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700' },
});

function OwnBookingCard({ reservation, onPress, tc, isDark }: { reservation: Reservation; onPress: () => void; tc: any; isDark: boolean }) {
  const venueName = reservation.slot?.availability?.venue?.name ?? 'Venue';
  const start = reservation.slot?.startTime ? formatAMPM(reservation.slot.startTime) : '';
  const end = reservation.slot?.endTime ? formatAMPM(reservation.slot.endTime) : '';
  const statusColor = STATUS_COLOR[reservation.status] ?? '#888';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[ownBookStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
    >
      <View style={[ownBookStyles.statusBar, { backgroundColor: statusColor }]} />
      <View style={ownBookStyles.body}>
        <View style={ownBookStyles.topRow}>
          <Text style={[ownBookStyles.venue, { color: tc.textPrimary }]} numberOfLines={1}>{venueName}</Text>
          <View style={[ownBookStyles.badge, { backgroundColor: `${statusColor}18` }]}>
            <Text style={[ownBookStyles.badgeText, { color: statusColor }]}>{reservation.status.replace('_', ' ')}</Text>
          </View>
        </View>
        <View style={ownBookStyles.meta}>
          <Ionicons name="calendar-outline" size={12} color={tc.textHint} />
          <Text style={[ownBookStyles.metaText, { color: tc.textSecondary }]}>{formatDate(reservation.slotDate)}</Text>
          {start ? (
            <>
              <Text style={{ color: tc.textHint }}> · </Text>
              <Ionicons name="time-outline" size={12} color={tc.textHint} />
              <Text style={[ownBookStyles.metaText, { color: tc.textSecondary }]}>{start}{end ? ` – ${end}` : ''}</Text>
            </>
          ) : null}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tc.textHint} />
    </TouchableOpacity>
  );
}

const ownBookStyles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.card, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1, overflow: 'hidden' },
  statusBar: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, padding: spacing.md },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  venue: { fontSize: 14, fontWeight: '600', flex: 1, marginRight: 8 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  metaText: { fontSize: 11 },
});

export function CoachDashboardScreen() {
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();
  const openNotifications = useUIStore((s) => s.openNotifications);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  const {
    pendingCount, confirmedCount, completedCount,
    upcomingToday, recentReservations, availabilities,
    isLoading, fetchDashboardData, earnings,
  } = useCoachDashboardStore();

  const { reservations, fetchOwnReservations } = useReservationsStore();

  const ownActiveBookings = reservations.filter(
    (r) => r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED,
  );

  useEffect(() => {
    fetchDashboardData();
    fetchOwnReservations();
  }, []);

  const onRefresh = useCallback(() => {
    fetchDashboardData();
    fetchOwnReservations();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
      <BackgroundShapes isDark={isDark} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#0B1A3E" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.dashHeader}>
          <View style={[styles.rolePill, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
            <FontAwesome6 name="people-group" size={11} color={isDark ? '#A2B8FF' : colors.navy} />
            <Text style={[styles.rolePillText, { color: isDark ? '#A2B8FF' : colors.navy }]}>Coach</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={openNotifications} style={[styles.headerBtn, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
              <Ionicons name="notifications-outline" size={20} color={tc.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={openDrawer} style={[styles.headerBtn, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
              <Ionicons name="menu-outline" size={22} color={tc.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <HeroSection name={user?.name ?? 'Coach'} isDark={isDark} />

        {/* Revenue card */}
        <RevenueCard earnings={earnings} isDark={isDark} tc={tc} />

        {/* Stadiums entry card */}
        <Animated.View entering={FadeInDown.delay(50).springify()}>
          <TouchableOpacity
            style={[styles.stadiumCard, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('StadiumsScreen')}
          >
            <View style={[styles.stadiumIconBox, { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : 'rgba(11,26,62,0.08)' }]}>
              <MaterialCommunityIcons name="stadium-outline" size={26} color={isDark ? '#A2B8FF' : colors.navy} />
            </View>
            <View style={styles.stadiumText}>
              <Text style={[styles.stadiumLabel, { color: tc.textPrimary }]}>Stadiums</Text>
              <Text style={[styles.stadiumHint, { color: tc.textHint }]}>Browse & book a venue</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={tc.textHint} />
          </TouchableOpacity>
        </Animated.View>

        {/* Pending Approvals CTA */}
        {pendingCount > 0 && (
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <TouchableOpacity
              style={[styles.pendingCard, { backgroundColor: 'rgba(255,149,0,0.1)', borderColor: 'rgba(255,149,0,0.3)' }]}
              onPress={() => navigation.navigate('CoachBookingsTab')}
            >
              <Ionicons name="time-outline" size={20} color="#FF9500" />
              <Text style={[styles.pendingText, { color: '#FF9500' }]}>
                {pendingCount} booking{pendingCount > 1 ? 's' : ''} awaiting your approval
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FF9500" />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Metric cards */}
        <View style={styles.metricsRow}>
          <MetricCard label="Pending" value={pendingCount} color="#FF9500" icon="time-outline" delay={100} tc={tc} isDark={isDark} />
          <MetricCard label="Confirmed" value={confirmedCount} color="#00C16A" icon="checkmark-circle-outline" delay={140} tc={tc} isDark={isDark} />
          <MetricCard label="Completed" value={completedCount} color="#6366F1" icon="trophy-outline" delay={180} tc={tc} isDark={isDark} />
        </View>

        {/* Up next */}
        {upcomingToday.length > 0 && (
          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Up Next Today</Text>
            <UpNextCard reservation={upcomingToday[0]} tc={tc} isDark={isDark} />
          </Animated.View>
        )}

        {/* My Availabilities */}
        {availabilities.length > 0 && (
          <Animated.View entering={FadeInDown.delay(260).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>My Availabilities</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CoachAvailabilityTab')}>
                <Text style={{ color: isDark ? '#7FAFD6' : '#0B1A3E', fontWeight: '600', fontSize: 13 }}>Edit</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.availCard, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
              {availabilities.slice(0, 4).map((a) => (
                <View key={a.id} style={styles.availRow}>
                  <View style={[styles.availDot, { backgroundColor: a.isActive ? '#00C16A' : '#888' }]} />
                  <Text style={[styles.availDay, { color: tc.textPrimary }]}>{a.day}</Text>
                  <Text style={[styles.availTime, { color: tc.textSecondary }]}>{a.startTime?.slice(0, 5)} – {a.endTime?.slice(0, 5)}</Text>
                  <Text style={[styles.availVenue, { color: tc.textHint }]} numberOfLines={1}>{(a as any).venue?.name ?? ''}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* My Venue Bookings (pending + confirmed) */}
        {ownActiveBookings.length > 0 && (
          <Animated.View entering={FadeInDown.delay(290).springify()}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>My Venue Bookings</Text>
              <TouchableOpacity onPress={() => navigation.navigate('StadiumsScreen')}>
                <Text style={{ color: isDark ? '#7FAFD6' : '#0B1A3E', fontWeight: '600', fontSize: 13 }}>Browse</Text>
              </TouchableOpacity>
            </View>
            {ownActiveBookings.slice(0, 5).map((r) => (
              <OwnBookingCard
                key={r.id}
                reservation={r}
                tc={tc}
                isDark={isDark}
                onPress={() => navigation.navigate('ReservationDetail', { reservationId: r.id })}
              />
            ))}
          </Animated.View>
        )}

        {/* Recent activity */}
        {recentReservations.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Recent Activity</Text>
            <View style={[styles.actCard, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
              {recentReservations.map((r) => (
                <ActivityItem key={r.id} reservation={r} tc={tc} isDark={isDark} />
              ))}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  dashHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  rolePillText: { fontSize: 12, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#FF3B30', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  stadiumCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: spacing.md, marginBottom: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  stadiumIconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stadiumText: { flex: 1 },
  stadiumLabel: { fontSize: 15, fontWeight: '700' },
  stadiumHint: { fontSize: 12, marginTop: 2 },
  pendingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, borderRadius: 14, borderWidth: 1, marginBottom: spacing.md },
  pendingText: { flex: 1, fontWeight: '600', fontSize: 14 },
  metricsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  availCard: { borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  availDot: { width: 8, height: 8, borderRadius: 4 },
  availDay: { width: 90, fontWeight: '600', fontSize: 13 },
  availTime: { fontSize: 12, flex: 1 },
  availVenue: { fontSize: 11, maxWidth: 90 },
  actCard: { borderRadius: 18, padding: spacing.md, marginBottom: spacing.md },
});
