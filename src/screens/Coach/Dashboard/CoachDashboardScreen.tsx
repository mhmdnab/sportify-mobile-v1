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
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../stores/auth.store';
import { useCoachDashboardStore } from '../../../stores/coach-dashboard.store';
import { useThemeStore } from '../../../stores/theme.store';
import { useThemeColors } from '../../../theme/useThemeColors';
import { spacing } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { Reservation, ReservationStatus } from '../../../types/api';
import { formatTime } from '../../../utils/date';

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
            <Ionicons name="fitness" size={11} color="rgba(255,255,255,0.8)" />
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
        <View style={upStyles.accentBar} />
        <View style={upStyles.body}>
          <View style={upStyles.badge}><View style={upStyles.badgeDot} /><Text style={upStyles.badgeLabel}>Up Next</Text></View>
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

export function CoachDashboardScreen() {
  const { t } = useTranslation();
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();
  const user = useAuthStore((s) => s.user);
  const navigation = useNavigation<any>();

  const {
    pendingCount, confirmedCount, completedCount,
    upcomingToday, recentReservations, availabilities,
    isLoading, fetchDashboardData,
  } = useCoachDashboardStore();

  useEffect(() => { fetchDashboardData(); }, []);

  const onRefresh = useCallback(() => { fetchDashboardData(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#060F28' : '#F4F6FB' }}>
      <BackgroundShapes isDark={isDark} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#0B1A3E" />}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection name={user?.name ?? 'Coach'} isDark={isDark} />

        {/* Pending Approvals CTA */}
        {pendingCount > 0 && (
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <TouchableOpacity
              style={[styles.pendingCard, { backgroundColor: 'rgba(255,149,0,0.1)', borderColor: 'rgba(255,149,0,0.3)' }]}
              onPress={() => navigation.navigate('Bookings')}
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
          <MetricCard label="Completed" value={completedCount} color="#0B1A3E" icon="trophy-outline" delay={180} tc={tc} isDark={isDark} />
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
              <TouchableOpacity onPress={() => navigation.navigate('Availability')}>
                <Text style={{ color: '#0B1A3E', fontWeight: '600', fontSize: 13 }}>Edit</Text>
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
