import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Switch, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { useUIStore } from '../../stores/ui.store';
import { useLanguageStore } from '../../stores/language.store';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { pickAndUploadImage } from '../../lib/upload';
import { api } from '../../lib/api';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;

const AVATAR_SIZE = 120;

export function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const openNotifications = useUIStore((s) => s.openNotifications);
  const isDark = useThemeStore((s) => s.isDark);
  const { locale, setLocale } = useLanguageStore();
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const tc = useThemeColors();

  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
    finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    (navigation as any).reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const headerBg = isDark ? '#040B1E' : colors.navy;

  const cardBg = tc.cardBg;
  const textColor = tc.textPrimary;
  const subTextColor = tc.textSecondary;

  return (
    <View style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      {/* Fixed header — title + curve + avatar all together */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: headerBg }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.profile')}</Text>
          <View style={{ width: 24 }} />
        </View>
      </SafeAreaView>
      <View style={[styles.headerBg, { backgroundColor: headerBg }]} />
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatarBorder, { borderColor: cardBg, backgroundColor: cardBg }]}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <View style={[styles.avatarImage, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.cameraBtn} onPress={handleAvatarUpload} disabled={uploadingAvatar}>
          <Ionicons name={uploadingAvatar ? 'hourglass-outline' : 'camera'} size={14} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        {/* General Information */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="information-circle-outline" size={20} color={textColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profile.generalInfo')}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil-outline" size={20} color={textColor} />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <InfoRow label={t('profile.username')} value={user?.name || t('common.user')} textColor={textColor} subColor={subTextColor} />
            <InfoRow label={t('profile.email')} value={user?.email || '-'} textColor={textColor} subColor={subTextColor} />
            <InfoRow label={t('profile.phone')} value={user?.phone || '-'} textColor={textColor} subColor={subTextColor} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.quickActions, { backgroundColor: cardBg }]}>
          <QuickAction icon="heart-outline" label={t('profile.favorite')} onPress={() => {}} color={textColor} />
          <QuickAction icon="calendar-outline" label={t('profile.reservation')} onPress={() => (navigation as any).navigate('BookingsTab')} color={textColor} />
          <QuickAction icon="notifications-outline" label={t('profile.notification')} onPress={openNotifications} color={textColor} />
        </View>

        {/* Appearance */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={textColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profile.appearance')}</Text>
            </View>
          </View>
          <View style={styles.darkModeRow}>
            <View style={styles.darkModeInfo}>
              <Text style={[styles.infoLabel, { color: textColor }]}>{t('profile.darkMode')}</Text>
              <Text style={[styles.infoValue, { color: subTextColor }]}>
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
        </View>

        {/* Language */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="language-outline" size={20} color={textColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profile.language')}</Text>
            </View>
          </View>
          <View style={styles.languageRow}>
            <TouchableOpacity
              style={[styles.languageOption, locale === 'en' && styles.languageOptionActive]}
              onPress={() => setLocale('en')}
            >
              <Text style={[styles.languageText, locale === 'en' && styles.languageTextActive]}>
                {t('profile.english')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, locale === 'ar' && styles.languageOptionActive]}
              onPress={() => setLocale('ar')}
            >
              <Text style={[styles.languageText, locale === 'ar' && styles.languageTextActive]}>
                {t('profile.arabic')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security Information */}
        <View style={[styles.section, { backgroundColor: cardBg }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="lock-closed-outline" size={20} color={textColor} />
              <Text style={[styles.sectionTitle, { color: textColor }]}>{t('profile.securityInfo')}</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity>
              <Text style={[styles.infoLabel, { color: textColor }]}>{t('profile.changePassword')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutSection, { backgroundColor: cardBg }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, textColor, subColor }: { label: string; value: string; textColor: string; subColor: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: subColor }]}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={styles.quickActionItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.quickActionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },
  headerBg: {
    height: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: -1,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -AVATAR_SIZE / 2,
    zIndex: 10,
    marginBottom: 16,
  },
  avatarBorder: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFF',
    fontSize: 40,
    fontWeight: '700',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 4,
    right: '35%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#888',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  infoRow: {
    marginTop: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 14,
    marginTop: 2,
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  darkModeInfo: {
    gap: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginHorizontal: spacing.screenPadding,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  logoutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.screenPadding,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
  languageRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  languageOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  languageOptionActive: {
    borderColor: colors.navy,
    backgroundColor: `${colors.navy}10`,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  languageTextActive: {
    color: colors.navy,
    fontWeight: '700',
  },
});
