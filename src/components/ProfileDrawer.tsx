import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { useThemeStore } from '../stores/theme.store';
import { useAuthStore } from '../stores/auth.store';
import { useReservationsStore } from '../stores/reservations.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

const MENU_GROUPS: {
  label: string;
  items: { icon: keyof typeof Ionicons.glyphMap; label: string; key: string; iconBg: string }[];
}[] = [
  {
    label: 'Account',
    items: [
      { icon: 'person', label: 'My Profile', key: 'profile', iconBg: '#0B1A3E' },
      { icon: 'calendar', label: 'My Bookings', key: 'bookings', iconBg: '#0EA5E9' },
      { icon: 'notifications', label: 'Notifications', key: 'notifications', iconBg: '#F59E0B' },
    ],
  },
  {
    label: 'Info',
    items: [
      { icon: 'help-circle', label: 'FAQs', key: 'faqs', iconBg: '#10B981' },
      { icon: 'document-text', label: 'Terms & Conditions', key: 'terms', iconBg: '#0B1A3E' },
      { icon: 'shield-checkmark', label: 'Privacy Policy', key: 'privacy', iconBg: '#EC4899' },
    ],
  },
];

export function ProfileDrawer({ visible, onClose, onNavigate }: ProfileDrawerProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isDark = useThemeStore((s) => s.isDark);
  const reservations = useReservationsStore((s) => s.reservations);

  const drawerBg = isDark ? '#060F28' : colors.navy;
  const groupBg = 'rgba(255,255,255,0.06)';

  const translateX = useSharedValue(DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      translateX.value = withSpring(0, { damping: 18, stiffness: 160, mass: 0.8 });
      backdropOpacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
      contentOpacity.value = withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) });
    } else {
      translateX.value = withSpring(DRAWER_WIDTH, { damping: 22, stiffness: 200, mass: 0.7 });
      backdropOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
      contentOpacity.value = withTiming(0, { duration: 160 });
    }
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const totalBookings = reservations.length;

  const now = new Date();
  const monthBookings = reservations.filter((r) => {
    const d = new Date(r.slotDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const handleLogout = async () => {
    onClose();
    await logout();
    onNavigate('logout');
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents={visible ? 'auto' : 'none'}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <ReAnimated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      {/* Drawer panel */}
      <ReAnimated.View
        style={[styles.drawer, { backgroundColor: drawerBg, paddingTop: insets.top }, drawerStyle]}
      >
        {/* Decorative circles */}
        <View style={[styles.decoCircle, { width: 200, height: 200, right: -60, top: -60 }]} />
        <View style={[styles.decoCircle, { width: 120, height: 120, right: 30, top: 80, opacity: 0.05 }]} />

        <ReAnimated.View style={[styles.content, contentStyle]}>
          {/* ── Close button ── */}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* ── Profile block ── */}
            <View style={styles.profileBlock}>
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {user?.image ? (
                  <Image source={{ uri: user.image }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitials}>{initials}</Text>
                  </View>
                )}
                <View style={styles.onlineDot} />
              </View>

              <Text style={styles.userName}>{user?.name ?? 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email ?? ''}</Text>

              {/* Mini stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statNum}>{totalBookings}</Text>
                  <Text style={styles.statLbl}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statPill}>
                  <Text style={styles.statNum}>{monthBookings}</Text>
                  <Text style={styles.statLbl}>This Month</Text>
                </View>
              </View>
            </View>

            {/* ── Menu groups ── */}
            {MENU_GROUPS.map((group) => (
              <View key={group.label} style={styles.groupBlock}>
                <Text style={styles.groupLabel}>{group.label.toUpperCase()}</Text>
                <View style={[styles.groupCard, { backgroundColor: groupBg }]}>
                  {group.items.map((item, idx) => (
                    <DrawerItem
                      key={item.key}
                      icon={item.icon}
                      label={item.label}
                      iconBg={item.iconBg}
                      isLast={idx === group.items.length - 1}
                      onPress={() => { onClose(); onNavigate(item.key); }}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* ── Logout ── */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
              <View style={[styles.itemIconWrap, { backgroundColor: 'rgba(255,68,68,0.18)' }]}>
                <Ionicons name="log-out-outline" size={16} color="#FF4444" />
              </View>
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <View style={{ height: insets.bottom + 24 }} />
          </ScrollView>
        </ReAnimated.View>
      </ReAnimated.View>
    </View>
  );
}

function DrawerItem({
  icon,
  label,
  iconBg,
  isLast,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconBg: string;
  isLast: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.itemIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={16} color="#fff" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: -10, height: 0 }, shadowOpacity: 0.35, shadowRadius: 24 },
      android: { elevation: 28 },
    }),
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  content: { flex: 1 },
  scroll: { paddingHorizontal: 20 },

  // Close
  closeBtn: {
    alignSelf: 'flex-end',
    marginRight: 20,
    marginTop: 12,
    marginBottom: 4,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Profile
  profileBlock: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 24,
  },
  avatarWrap: { position: 'relative', marginBottom: 14 },
  avatar: { width: 82, height: 82, borderRadius: 26 },
  avatarFallback: {
    backgroundColor: 'rgba(11,26,62,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  avatarInitials: { color: '#fff', fontSize: 30, fontWeight: '800' },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: colors.navy,
  },
  userName: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4, letterSpacing: -0.3 },
  userEmail: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 0,
  },
  statPill: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLbl: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },

  // Groups
  groupBlock: { marginBottom: 18 },
  groupLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  itemIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.88)' },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  logoutText: { fontSize: 14, fontWeight: '700', color: '#FF4444' },
});
