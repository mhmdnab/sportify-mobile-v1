import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Switch,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { spacing } from '../../theme/spacing';
import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import { ProfileStackParamList } from '../../types/navigation';
import { useTranslation } from 'react-i18next';

import { useLanguageStore } from '../../stores/language.store';
import { pickAndUploadImage } from '../../lib/upload';
import { api } from '../../lib/api';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;

const AVATAR_SIZE = 96;

export function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const isDark = useThemeStore((s) => s.isDark);
  const { locale, setLocale } = useLanguageStore();
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const tc = useThemeColors();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const screenBg = isDark ? '#0A0F1E' : '#F0F2F8';
  const cardBg = isDark ? '#0C1832' : '#FFFFFF';
  const heroBg = isDark ? '#0B1740' : colors.navy;

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  const handleAvatarUpload = async () => {
    try {
      setUploadingAvatar(true);
      const url = await pickAndUploadImage();
      if (url) {
        await api.put('/users/profile', { image: url });
        await refreshProfile();
      }
    } catch {}
    finally { setUploadingAvatar(false); }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            await logout();
            (navigation as any).reset({ index: 0, routes: [{ name: 'Auth' }] });
          },
        },
      ],
    );
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        {/* ── Hero card ── */}
        <View style={[styles.hero, { backgroundColor: heroBg, paddingTop: insets.top + 12 }]}>
          {/* Decorative circles */}
          <View style={[styles.decoCircle, { width: 200, height: 200, right: -40, top: -60 }]} />
          <View style={[styles.decoCircle, { width: 130, height: 130, left: -30, bottom: -50, opacity: 0.06 }]} />

          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.25)' }]}>
              {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatarImg} contentFit="cover" />
              ) : (
                <View style={[styles.avatarImg, styles.avatarFallback]}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.cameraBtn} onPress={handleAvatarUpload} disabled={uploadingAvatar}>
              <Ionicons name={uploadingAvatar ? 'hourglass-outline' : 'camera'} size={13} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Name + role */}
          <Text style={styles.heroName}>{user?.name ?? 'User'}</Text>
          <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>

        </View>

        {/* ── Quick shortcuts ── */}
        <View style={[styles.shortcutsRow, { marginTop: -1 }]}>
          <ShortcutBtn
            icon="calendar-outline"
            label="Reservations"
            iconBg={isDark ? 'rgba(162,184,255,0.15)' : '#EEF0FF'}
            iconColor={isDark ? '#A2B8FF' : '#0B1A3E'}
            onPress={() => navigation.navigate('MyReservations')}
            cardBg={cardBg}
            isDark={isDark}
          />
          <ShortcutBtn
            icon="pencil-outline"
            label="Edit Profile"
            iconBg={isDark ? 'rgba(74,222,128,0.12)' : '#E8F5E9'}
            iconColor={isDark ? '#4ADE80' : '#22C55E'}
            onPress={() => navigation.navigate('EditProfile')}
            cardBg={cardBg}
            isDark={isDark}
          />
        </View>

        <View style={styles.body}>
          {/* ── General Info ── */}
          <SectionCard
            icon="person-outline"
            iconBg={isDark ? 'rgba(162,184,255,0.15)' : '#EEF0FF'}
            iconColor={isDark ? '#A2B8FF' : '#0B1A3E'}
            title={t('profile.generalInfo')}
            cardBg={cardBg}
            tc={tc}
            isDark={isDark}
            action={
              <TouchableOpacity
                style={[styles.editPill, { backgroundColor: isDark ? 'rgba(162,184,255,0.12)' : '#EEF0FF' }]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Ionicons name="pencil-outline" size={13} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
                <Text style={[styles.editPillText, { color: isDark ? '#A2B8FF' : '#0B1A3E' }]}>Edit</Text>
              </TouchableOpacity>
            }
          >
            <InfoRow icon="person-circle-outline" label={t('profile.username')} value={user?.name || '—'} tc={tc} />
            <View style={[styles.rowDivider, { backgroundColor: tc.border }]} />
            <InfoRow icon="mail-outline" label={t('profile.email')} value={user?.email || '—'} tc={tc} />
            {user?.phone ? (
              <>
                <View style={[styles.rowDivider, { backgroundColor: tc.border }]} />
                <InfoRow icon="call-outline" label={t('profile.phone')} value={user.phone} tc={tc} />
              </>
            ) : null}
          </SectionCard>

          {/* ── Appearance ── */}
          <SectionCard
            icon={isDark ? 'moon' : 'sunny-outline'}
            iconBg={isDark ? 'rgba(245,158,11,0.12)' : '#FFF8E1'}
            iconColor="#F59E0B"
            title={t('profile.appearance')}
            cardBg={cardBg}
            tc={tc}
            isDark={isDark}
          >
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Text style={[styles.toggleLabel, { color: tc.textPrimary }]}>{t('profile.darkMode')}</Text>
                <Text style={[styles.toggleSub, { color: tc.textHint }]}>
                  {isDark ? t('profile.on') : t('profile.off')}
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#D1D1D6', true: colors.navy }}
                thumbColor="#FFF"
                ios_backgroundColor="#D1D1D6"
              />
            </View>
          </SectionCard>

          {/* ── Language ── */}
          <SectionCard
            icon="language-outline"
            iconBg={isDark ? 'rgba(8,145,178,0.12)' : '#E0F7FA'}
            iconColor={isDark ? '#22D3EE' : '#0891B2'}
            title={t('profile.language')}
            cardBg={cardBg}
            tc={tc}
            isDark={isDark}
          >
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  { borderColor: locale === 'en' ? (isDark ? '#A2B8FF' : colors.navy) : tc.border },
                  locale === 'en' && { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : `${colors.navy}10` },
                ]}
                onPress={() => setLocale('en')}
              >
                <Text style={[styles.langBtnText, { color: locale === 'en' ? (isDark ? '#A2B8FF' : colors.navy) : tc.textSecondary }]}>
                  English
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.langBtn,
                  { borderColor: locale === 'ar' ? (isDark ? '#A2B8FF' : colors.navy) : tc.border },
                  locale === 'ar' && { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : `${colors.navy}10` },
                ]}
                onPress={() => setLocale('ar')}
              >
                <Text style={[styles.langBtnText, { color: locale === 'ar' ? (isDark ? '#A2B8FF' : colors.navy) : tc.textSecondary }]}>
                  العربية
                </Text>
              </TouchableOpacity>
            </View>
          </SectionCard>

          {/* ── Security ── */}
          <SectionCard
            icon="lock-closed-outline"
            iconBg={isDark ? 'rgba(233,30,99,0.12)' : '#FCE4EC'}
            iconColor={isDark ? '#F472B6' : '#E91E63'}
            title={t('profile.securityInfo')}
            cardBg={cardBg}
            tc={tc}
            isDark={isDark}
          >
            <TouchableOpacity style={styles.menuRow}>
              <View style={styles.menuRowLeft}>
                <View style={[styles.menuRowIconBox, { backgroundColor: isDark ? 'rgba(233,30,99,0.12)' : '#FCE4EC' }]}>
                  <Ionicons name="key-outline" size={15} color={isDark ? '#F472B6' : '#E91E63'} />
                </View>
                <Text style={[styles.menuRowLabel, { color: tc.textPrimary }]}>{t('profile.changePassword')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tc.textHint} />
            </TouchableOpacity>
          </SectionCard>

          {/* ── Logout ── */}
          <TouchableOpacity
            style={[styles.logoutCard, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,68,68,0.12)' }]}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <View style={[styles.menuRowIconBox, { backgroundColor: 'rgba(255,68,68,0.1)' }]}>
              <Ionicons name="log-out-outline" size={16} color={colors.error} />
            </View>
            <Text style={[styles.logoutText, { color: colors.error }]}>{t('profile.logout')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.error} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ── Sub-components ──

function ShortcutBtn({
  icon, label, iconBg, iconColor, onPress, cardBg, isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  iconBg: string;
  iconColor: string;
  onPress: () => void;
  cardBg: string;
  isDark?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.shortcutCard,
        { backgroundColor: cardBg },
        isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.shortcutIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.shortcutLabel, { color: iconColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionCard({
  icon, iconBg, iconColor, title, children, cardBg, tc, action, isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  children: React.ReactNode;
  cardBg: string;
  tc: any;
  action?: React.ReactNode;
  isDark?: boolean;
}) {
  return (
    <View style={[styles.sectionCard, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: iconBg }]}>
            <Ionicons name={icon} size={16} color={iconColor} />
          </View>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{title}</Text>
        </View>
        {action}
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoRow({
  icon, label, value, tc,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tc: any;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={15} color={tc.textHint} style={{ marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.infoLabel, { color: tc.textHint }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: tc.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 28,
    overflow: 'hidden',
  },
  decoCircle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    alignSelf: 'center',
    marginBottom: 14,
  },
  avatarRing: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: (AVATAR_SIZE + 6) / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { color: '#FFF', fontSize: 34, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  heroName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Shortcuts
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 4,
  },
  shortcutCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  shortcutIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: { fontSize: 11, fontWeight: '700' },

  // Body
  body: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 14,
    gap: 12,
  },

  // Section card
  sectionCard: {
    borderRadius: 18,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },

  // Edit pill
  editPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  editPillText: { fontSize: 12, fontWeight: '700' },

  // Info row
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 8 },
  infoLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '600' },
  rowDivider: { height: 1, marginLeft: 28 },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLeft: { gap: 2 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleSub: { fontSize: 12 },

  // Language
  langRow: { flexDirection: 'row', gap: 10, paddingTop: 4 },
  langBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  langBtnActive: {},
  langBtnText: { fontSize: 14, fontWeight: '600' },

  // Menu row
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuRowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowLabel: { fontSize: 14, fontWeight: '600' },

  // Logout
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});
