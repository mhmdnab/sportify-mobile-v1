import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing } from '../../theme/spacing';
import { useNotificationsStore } from '../../stores/notifications.store';
import { useReservationsStore } from '../../stores/reservations.store';
import { HomeStackParamList } from '../../types/navigation';
import { HomeHeader } from './components/HomeHeader';
import { ProfileDrawer } from '../../components/ProfileDrawer';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { useUIStore } from '../../stores/ui.store';
import { useAssistantStore } from '../../stores/assistant.store';
import { Reservation } from '../../types/api';
import { formatTime } from '../../utils/date';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

function ScheduleCard({ reservation, onPress, tc, isDark }: {
  reservation: Reservation;
  onPress: () => void;
  tc: any;
  isDark: boolean;
}) {
  const venueName = reservation.slot?.availability?.venue?.name ?? 'Venue';
  const startTime = reservation.slot?.startTime ? formatTime(reservation.slot.startTime) : '—';
  const endTime = reservation.slot?.endTime ? formatTime(reservation.slot.endTime) : '—';
  const date = reservation.slotDate
    ? new Date(reservation.slotDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : '—';
  const hasCoach = !!(reservation as any).withCoach;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[schedStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
    >
      <View style={schedStyles.leftBar} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={[schedStyles.venue, { color: tc.textPrimary }]} numberOfLines={1}>{venueName}</Text>
          {hasCoach && (
            <View style={schedStyles.coachBadge}>
              <FontAwesome6 name="people-group" size={9} color="#fff" />
              <Text style={schedStyles.coachBadgeText}>Coach</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons name="calendar-outline" size={12} color={tc.textSecondary} />
          <Text style={[schedStyles.meta, { color: tc.textSecondary }]}>{date}</Text>
          <Text style={[schedStyles.meta, { color: tc.textHint }]}>·</Text>
          <Ionicons name="time-outline" size={12} color={tc.textSecondary} />
          <Text style={[schedStyles.meta, { color: tc.textSecondary }]}>{startTime} – {endTime}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={tc.textHint} />
    </TouchableOpacity>
  );
}

const schedStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  leftBar: { width: 3, height: 36, borderRadius: 2, backgroundColor: '#0B1A3E' },
  venue: { fontSize: 14, fontWeight: '700', flex: 1 },
  meta: { fontSize: 12 },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0B1A3E',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coachBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const { reservations, fetchOwnReservations } = useReservationsStore();
  const [refreshing, setRefreshing] = useState(false);
  const openNotifications = useUIStore((s) => s.openNotifications);
  const drawerVisible = useUIStore((s) => s.isDrawerOpen);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  const scrollY = useSharedValue(0);
  const contentScale = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const contentBorderRadius = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    const openConfig = { damping: 18, stiffness: 160, mass: 0.8 };
    const closeConfig = { damping: 22, stiffness: 200, mass: 0.7 };
    if (drawerVisible) {
      contentScale.value = withSpring(0.88, openConfig);
      contentTranslateX.value = withSpring(-80, openConfig);
      contentBorderRadius.value = withTiming(24, { duration: 350, easing: Easing.out(Easing.cubic) });
    } else {
      contentScale.value = withSpring(1, closeConfig);
      contentTranslateX.value = withSpring(0, closeConfig);
      contentBorderRadius.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    }
  }, [drawerVisible]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }, { translateX: contentTranslateX.value }],
    borderRadius: contentBorderRadius.value,
    overflow: 'hidden' as const,
  }));

  const setScreen = useAssistantStore((s) => s.setScreen);

  useFocusEffect(
    useCallback(() => {
      fetchOwnReservations();
      fetchNotifications();
      setScreen('home');
      return () => setScreen('general');
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchOwnReservations(), fetchNotifications()]);
    setRefreshing(false);
  };

  const handleDrawerNavigate = (screen: string) => {
    switch (screen) {
      case 'profile': (navigation as any).navigate('ProfileTab', { screen: 'ProfileScreen' }); break;
      case 'bookings': (navigation as any).navigate('BookingsTab'); break;
      case 'notifications': closeDrawer(); setTimeout(() => openNotifications(), 300); break;
      case 'faqs': (navigation as any).navigate('ProfileTab', { screen: 'FAQs' }); break;
      case 'terms': (navigation as any).navigate('ProfileTab', { screen: 'Terms' }); break;
      case 'privacy': (navigation as any).navigate('ProfileTab', { screen: 'Privacy' }); break;
      case 'logout': (navigation as any).reset({ index: 0, routes: [{ name: 'Auth' }] }); break;
    }
  };

  // Upcoming reservations
  const upcomingReservations = reservations
    .filter((r) => ['PENDING', 'CONFIRMED', 'COACH_PENDING'].includes(r.status))
    .slice(0, 3);

  // Stats
  const now = new Date();
  const thisMonthCount = reservations.filter((r) => {
    if (r.status !== 'PAID') return false;
    const d = new Date(r.slotDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const allTimeCount = reservations.filter((r) => r.status === 'PAID').length;

  // Favorite venue
  const venueTally: Record<string, { id?: number; name: string; count: number }> = {};
  reservations.forEach((r) => {
    const venue = r.slot?.availability?.venue;
    if (venue?.name) {
      if (!venueTally[venue.name]) venueTally[venue.name] = { id: venue.id, name: venue.name, count: 0 };
      venueTally[venue.name].count++;
    }
  });
  const favoriteVenue = Object.values(venueTally).sort((a, b) => b.count - a.count)[0] ?? null;

  const cardBg = isDark ? '#0C1832' : '#FFFFFF';
  const navyBg = isDark ? '#0B1740' : colors.navy;

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? '#050505' : colors.navy }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[styles.container, { backgroundColor: tc.screenBg }, contentAnimStyle]}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          contentContainerStyle={styles.scrollContent}
        >
          <BackgroundShapes isDark={isDark} />

          <HomeHeader
            onNotificationPress={openNotifications}
            onAvatarPress={openDrawer}
            scrollY={scrollY}
          />

          {/* ─── Search bar ───────────────────────────────── */}
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('ExploreTab', { screen: 'ExploreScreen' })}
            activeOpacity={0.85}
            style={[styles.searchCard, { backgroundColor: navyBg }]}
          >
            <View style={styles.searchIconWrap}>
              <Ionicons name="search" size={16} color="rgba(255,255,255,0.55)" />
            </View>
            <Text style={styles.searchPlaceholder}>Search venues, sports, coaches…</Text>
          </TouchableOpacity>

          {/* ─── Entry Cards ──────────────────────────────── */}
          <View style={styles.cardsRow}>
            {/* Stadiums */}
            <TouchableOpacity
              style={[styles.entryCard, { backgroundColor: cardBg }]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('StadiumsScreen')}
            >
              <View style={[styles.entryIconCircle, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.08)' }]}>
                <MaterialCommunityIcons name="stadium-outline" size={26} color={isDark ? '#A2B8FF' : colors.navy} />
              </View>
              <Text style={[styles.entryCardTitle, { color: tc.textPrimary }]}>Stadiums</Text>
              <Text style={[styles.entryCardSub, { color: tc.textHint }]}>Book courts & fields</Text>
              <View style={[styles.entryArrow, { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : '#F0F2F8' }]}>
                <Ionicons name="arrow-forward" size={14} color={isDark ? '#A2B8FF' : colors.navy} />
              </View>
            </TouchableOpacity>

            {/* Coaches */}
            <TouchableOpacity
              style={[styles.entryCard, { backgroundColor: cardBg }]}
              activeOpacity={0.88}
              onPress={() => navigation.navigate('CoachesList')}
            >
              <View style={[styles.entryIconCircle, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.1)' }]}>
                <FontAwesome6 name="people-group" size={22} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
              </View>
              <Text style={[styles.entryCardTitle, { color: tc.textPrimary }]}>Coaches</Text>
              <Text style={[styles.entryCardSub, { color: tc.textHint }]}>Personal training</Text>
              <View style={[styles.entryArrow, { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : '#F0F2F8' }]}>
                <Ionicons name="arrow-forward" size={14} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
              </View>
            </TouchableOpacity>
          </View>

          {/* ─── My Schedule ──────────────────────────────── */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>My Schedule</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('BookingsTab')}>
                <Text style={[styles.seeAll, { color: isDark ? '#7FAFD6' : '#0B1A3E' }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {upcomingReservations.length === 0 ? (
              <View style={[styles.emptySchedule, { backgroundColor: cardBg }]}>
                <Ionicons name="calendar-outline" size={32} color={tc.textHint} />
                <Text style={[styles.emptyScheduleText, { color: tc.textHint }]}>No upcoming bookings</Text>
                <TouchableOpacity
                  style={[styles.bookNowPill, { backgroundColor: isDark ? '#1A3878' : '#0B1A3E' }]}
                  onPress={() => navigation.navigate('StadiumsScreen')}
                >
                  <Text style={styles.bookNowPillText}>Book a field</Text>
                </TouchableOpacity>
              </View>
            ) : (
              upcomingReservations.map((r) => (
                <ScheduleCard
                  key={r.id}
                  reservation={r}
                  tc={tc}
                  isDark={isDark}
                  onPress={() =>
                    (navigation as any).navigate('BookingsTab', {
                      screen: 'ReservationDetail',
                      params: { reservationId: r.id },
                    })
                  }
                />
              ))
            )}
          </View>

          {/* ─── Activity Stats ───────────────────────────── */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: tc.textPrimary, marginBottom: spacing.md }]}>
              My Activity
            </Text>

            {/* Stat cards row */}
            <View style={styles.cardsRow}>
              {/* This Month */}
              <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                <View style={[styles.statIconCircle, { backgroundColor: isDark ? '#1A3070' : 'rgba(14,165,233,0.1)' }]}>
                  <Ionicons name="calendar" size={20} color="#0EA5E9" />
                </View>
                <Text style={[styles.statNumber, { color: tc.textPrimary }]}>{thisMonthCount}</Text>
                <Text style={[styles.statLabel, { color: tc.textHint }]}>Played This Month</Text>
              </View>

              {/* All Time */}
              <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                <View style={[styles.statIconCircle, { backgroundColor: isDark ? '#132452' : 'rgba(245,158,11,0.1)' }]}>
                  <Ionicons name="trophy" size={20} color="#F59E0B" />
                </View>
                <Text style={[styles.statNumber, { color: tc.textPrimary }]}>{allTimeCount}</Text>
                <Text style={[styles.statLabel, { color: tc.textHint }]}>Total Played</Text>
              </View>
            </View>

            {/* Favorite venue */}
            {favoriteVenue && (
              <TouchableOpacity
                activeOpacity={0.82}
                style={[styles.favVenueCard, { backgroundColor: navyBg }]}
                onPress={() =>
                  favoriteVenue.id
                    ? navigation.navigate('VenueDetail', { venueId: favoriteVenue.id })
                    : navigation.navigate('StadiumsScreen')
                }
              >
                <View style={[styles.decorCircle, { width: 90, height: 90, right: -20, top: -25, backgroundColor: 'rgba(255,255,255,0.06)' }]} />
                <View style={[styles.decorCircle, { width: 55, height: 55, right: 30, bottom: -20, backgroundColor: 'rgba(255,255,255,0.04)' }]} />
                <View style={styles.favVenueIcon}>
                  <Ionicons name="location" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.favVenueLabel}>Your Go-To Venue</Text>
                  <Text style={styles.favVenueName} numberOfLines={1}>{favoriteVenue.name}</Text>
                  <Text style={styles.favVenueCount}>
                    {favoriteVenue.count} {favoriteVenue.count === 1 ? 'booking' : 'bookings'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </Animated.View>

      <ProfileDrawer visible={drawerVisible} onClose={closeDrawer} onNavigate={handleDrawerNavigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingTop: 0 },

  // Search bar (navy, in scroll)
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  searchIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '400',
  },

  // Entry cards (white)
  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: 12,
    marginBottom: spacing.lg,
  },
  entryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    paddingBottom: 14,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  entryIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  entryCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  entryCardSub: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 14,
  },
  entryArrow: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle: {
    position: 'absolute',
    borderRadius: 999,
  },

  // Section
  sectionBlock: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // Empty schedule
  emptySchedule: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
      android: { elevation: 1 },
    }),
  },
  emptyScheduleText: { fontSize: 14 },
  bookNowPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 4,
  },
  bookNowPillText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Stat cards (white)
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  statIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: { fontSize: 30, fontWeight: '800', marginBottom: 3, letterSpacing: -0.5 },
  statLabel: { fontSize: 12, fontWeight: '500' },

  // Favorite venue card (navy)
  favVenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: colors.navy, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 14 },
      android: { elevation: 6 },
    }),
  },
  favVenueIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favVenueLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  favVenueName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  favVenueCount: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
});
