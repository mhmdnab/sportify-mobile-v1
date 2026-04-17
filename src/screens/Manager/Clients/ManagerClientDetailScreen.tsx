import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { ManagerClientsStackParamList } from '../../../types/navigation';

type RouteParams = RouteProp<ManagerClientsStackParamList, 'ManagerClientDetail'>;

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

function avatarColor(name: string): string {
  const palette = ['#00C16A', '#4A90D9', '#FF9500', '#9B59B6', '#E74C3C', '#1ABC9C'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function StatBox({ value, label, color, icon }: { value: string | number; label: string; color: string; icon: string }) {
  return (
    <View style={[statStyles.box, { backgroundColor: `${color}10` }]}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  box: { flex: 1, borderRadius: 16, padding: spacing.md, alignItems: 'center', gap: 4 },
  value: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  label: { fontSize: 10, fontWeight: '600', color: '#6B7280', textAlign: 'center' },
});

export function ManagerClientDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  const { name, email, phone, totalReservations, totalCancellations, totalPaid, totalRevenue } = route.params;
  const color = avatarColor(name);
  const initials = getInitials(name);
  const attendanceRate = totalReservations > 0
    ? Math.round(((totalReservations - totalCancellations) / totalReservations) * 100)
    : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Client Profile</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar + name */}
        <View style={styles.profileSection}>
          <View style={[styles.avatar, { backgroundColor: `${color}20` }]}>
            <Text style={[styles.initials, { color }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: tc.textPrimary }]}>{name}</Text>
          <View style={[styles.rateTag, { backgroundColor: attendanceRate >= 70 ? 'rgba(0,193,106,0.12)' : 'rgba(255,149,0,0.12)' }]}>
            <Ionicons name="ribbon-outline" size={12} color={attendanceRate >= 70 ? '#00C16A' : '#FF9500'} />
            <Text style={[styles.rateText, { color: attendanceRate >= 70 ? '#00C16A' : '#FF9500' }]}>
              {attendanceRate}% attendance
            </Text>
          </View>
        </View>

        {/* Contact info */}
        <View style={[styles.card, { backgroundColor: tc.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Contact</Text>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: 'rgba(74,144,217,0.1)' }]}>
              <Ionicons name="mail-outline" size={16} color="#4A90D9" />
            </View>
            <View style={styles.infoText}>
              <Text style={[styles.infoLabel, { color: tc.textHint }]}>Email</Text>
              <Text style={[styles.infoValue, { color: tc.textPrimary }]}>{email}</Text>
            </View>
          </View>
          {phone ? (
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: 'rgba(0,193,106,0.1)' }]}>
                <Ionicons name="call-outline" size={16} color="#00C16A" />
              </View>
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: tc.textHint }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: tc.textPrimary }]}>{phone}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Stats */}
        <View style={[styles.card, { backgroundColor: tc.cardBg }]}>
          <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>Stats</Text>
          <View style={styles.statsRow}>
            <StatBox value={totalReservations} label="Bookings" color="#4A90D9" icon="calendar" />
            <StatBox value={`$${totalRevenue.toFixed(0)}`} label="Revenue" color="#00C16A" icon="cash" />
          </View>
          <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
            <StatBox value={totalCancellations} label="Cancelled" color="#FF4444" icon="close-circle" />
            <StatBox value={totalPaid} label="Paid" color="#6B7280" icon="checkmark-done" />
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  scroll: { paddingHorizontal: spacing.screenPadding },
  profileSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  initials: { fontSize: 28, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  rateTag: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  rateText: { fontSize: 12, fontWeight: '600' },
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  infoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoText: { flex: 1, gap: 2 },
  infoLabel: { fontSize: 11, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: spacing.sm },
});
