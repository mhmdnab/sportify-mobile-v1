import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
  Platform,
  I18nManager,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { useThemeStore } from '../stores/theme.store';
import { useAuthStore } from '../stores/auth.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface ProfileDrawerProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
}

export function ProfileDrawer({ visible, onClose, onNavigate }: ProfileDrawerProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isDark = useThemeStore((s) => s.isDark);
  const drawerBg = isDark ? '#040B1E' : colors.navy;

  const translateX = useSharedValue(DRAWER_WIDTH);
  const backdropOpacity = useSharedValue(0);
  const itemsOpacity = useSharedValue(0);
  const mounted = useSharedValue(false);

  useEffect(() => {
    if (visible) {
      mounted.value = true;
      translateX.value = withSpring(0, {
        damping: 18,
        stiffness: 160,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
      itemsOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
    } else {
      translateX.value = withSpring(DRAWER_WIDTH, {
        damping: 22,
        stiffness: 200,
        mass: 0.7,
      });
      backdropOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) });
      itemsOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: itemsOpacity.value,
  }));

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = async () => {
    onClose();
    await logout();
    onNavigate('logout');
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <ReAnimated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <ReAnimated.View
        style={[
          styles.drawer,
          { paddingTop: insets.top + 16, backgroundColor: drawerBg },
          drawerStyle,
        ]}
      >
        <ReAnimated.View style={[styles.drawerContent, contentStyle]}>
          {/* Close button */}
          <TouchableOpacity onPress={onClose} style={[styles.closeBtn, I18nManager.isRTL && styles.closeBtnRTL]}>
            <Ionicons name="close" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Avatar & Info */}
          <View style={styles.profileSection}>
            <View style={styles.avatarRing}>
              {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>
            <Text style={styles.userName}>{user?.name || t('common.user')}</Text>
            <Text style={styles.userEmail}>{user?.email || ''}</Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <DrawerItem icon="person-outline" label={t('drawer.myProfile')} onPress={() => { onClose(); onNavigate('profile'); }} />
            <DrawerItem icon="calendar-outline" label={t('drawer.myBookings')} onPress={() => { onClose(); onNavigate('bookings'); }} />
            <DrawerItem icon="heart-outline" label={t('drawer.favorites')} onPress={() => { onClose(); }} />
            <DrawerItem icon="notifications-outline" label={t('drawer.notifications')} onPress={() => { onClose(); onNavigate('notifications'); }} />
            <DrawerItem icon="help-circle-outline" label={t('drawer.faqs')} onPress={() => { onClose(); onNavigate('faqs'); }} />
            <DrawerItem icon="document-text-outline" label={t('drawer.termsConditions')} onPress={() => { onClose(); onNavigate('terms'); }} />
            <DrawerItem icon="shield-checkmark-outline" label={t('drawer.privacyPolicy')} onPress={() => { onClose(); onNavigate('privacy'); }} />
          </View>

          {/* Logout */}
          <View style={styles.logoutContainer}>
            <TouchableOpacity style={[styles.logoutBtn, I18nManager.isRTL && styles.logoutBtnRTL]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
              <Text style={styles.logoutText}>{t('drawer.logout')}</Text>
            </TouchableOpacity>
          </View>
        </ReAnimated.View>
      </ReAnimated.View>
    </View>
  );
}

function DrawerItem({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  const isRTL = I18nManager.isRTL;
  return (
    <TouchableOpacity style={[styles.menuItem, isRTL && styles.menuItemRTL]} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={20} color="rgba(255,255,255,0.7)" />
      <Text style={[styles.menuLabel, isRTL && styles.menuLabelRTL]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.navy,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: -8, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  closeBtn: {
    alignSelf: 'flex-end',
    padding: 4,
    marginBottom: 8,
  },
  closeBtnRTL: {
    alignSelf: 'flex-start',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarFallback: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  menuSection: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
  },
  menuLabelRTL: {
    textAlign: 'right',
  },
  logoutContainer: {
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 16,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutBtnRTL: {
    flexDirection: 'row-reverse',
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
});
