import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useAuthStore } from '../../stores/auth.store';
import { ProfileStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileScreen'>;

const DARK_NAV = '#1A1A2E';

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    (navigation as any).reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dark header */}
        <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profile</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>
        <View style={styles.headerBg} />

        {/* Avatar overlapping header */}
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarBorder}>
            {user?.image ? (
              <Image source={{ uri: user.image }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={[styles.avatarImage, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.cameraBtn}>
            <Ionicons name="camera" size={14} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* General Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="information-circle-outline" size={20} color={DARK_NAV} />
              <Text style={styles.sectionTitle}>General Information</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Ionicons name="pencil-outline" size={20} color={DARK_NAV} />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <InfoRow label="Username" value={user?.name || 'User'} />
            <InfoRow label="E-mail" value={user?.email || '-'} />
            <InfoRow label="Phone number" value={user?.phone || '-'} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <QuickAction icon="heart-outline" label="Favorite" onPress={() => {}} />
          <QuickAction icon="calendar-outline" label="Reservation" onPress={() => (navigation as any).navigate('BookingsTab')} />
          <QuickAction icon="notifications-outline" label="Notification" onPress={() => {}} />
        </View>

        {/* Social Media */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="globe-outline" size={20} color={DARK_NAV} />
              <Text style={styles.sectionTitle}>Social Media</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="pencil-outline" size={20} color={DARK_NAV} />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <InfoRow label="Instagram" value="url" />
            <InfoRow label="Facebook" value="url" />
            <InfoRow label="TikTok" value="-" />
          </View>
        </View>

        {/* Security Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="lock-closed-outline" size={20} color={DARK_NAV} />
              <Text style={styles.sectionTitle}>Security Information</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity>
              <Text style={styles.infoLabel}>change password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutSection} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickActionItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={DARK_NAV} />
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const AVATAR_SIZE = 120;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F5',
  },
  headerSafeArea: {
    backgroundColor: DARK_NAV,
    zIndex: 2,
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
    color: colors.white,
  },
  headerBg: {
    height: 60,
    backgroundColor: DARK_NAV,
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
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: colors.white,
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
    backgroundColor: colors.white,
    marginHorizontal: spacing.screenPadding,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: DARK_NAV,
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
    color: DARK_NAV,
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
    color: DARK_NAV,
  },
  infoValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginHorizontal: spacing.screenPadding,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: DARK_NAV,
  },
  logoutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.screenPadding,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
  },
});
