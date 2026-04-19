import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../../stores/theme.store';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useOwnerVenuesStore } from '../../../stores/owner-venues.store';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { spacing } from '../../../theme/spacing';
import { colors } from '../../../theme/colors';
import { Venue } from '../../../types/api';

function VenueCard({ venue, onPress, tc, isDark }: { venue: Venue; onPress: () => void; tc: any; isDark: boolean }) {
  const branchName = (venue as any).branch?.name ?? '';
  const capacity = (venue as any).capacity ?? null;
  const price = venue.price ?? null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[cardStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
    >
      <View style={[cardStyles.iconBox, { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : 'rgba(11,26,62,0.07)' }]}>
        <Ionicons name="football-outline" size={24} color={isDark ? '#A2B8FF' : colors.navy} />
      </View>
      <View style={cardStyles.info}>
        <Text style={[cardStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>{venue.name}</Text>
        {branchName ? (
          <View style={cardStyles.branchRow}>
            <Ionicons name="business-outline" size={12} color={tc.textHint} />
            <Text style={[cardStyles.branch, { color: tc.textSecondary }]} numberOfLines={1}>{branchName}</Text>
          </View>
        ) : null}
        <View style={cardStyles.pillsRow}>
          {capacity !== null && (
            <View style={[cardStyles.pill, { backgroundColor: isDark ? 'rgba(162,184,255,0.08)' : 'rgba(11,26,62,0.06)' }]}>
              <Ionicons name="people-outline" size={11} color={isDark ? '#A2B8FF' : colors.navy} />
              <Text style={[cardStyles.pillText, { color: isDark ? '#A2B8FF' : colors.navy }]}>{capacity}</Text>
            </View>
          )}
          {price !== null && (
            <View style={[cardStyles.pill, { backgroundColor: isDark ? 'rgba(162,184,255,0.08)' : 'rgba(11,26,62,0.06)' }]}>
              <Ionicons name="cash-outline" size={11} color={isDark ? '#A2B8FF' : colors.navy} />
              <Text style={[cardStyles.pillText, { color: isDark ? '#A2B8FF' : colors.navy }]}>${price}/hr</Text>
            </View>
          )}
        </View>
      </View>
      <View style={[cardStyles.bookBtn, { backgroundColor: isDark ? 'rgba(162,184,255,0.1)' : 'rgba(11,26,62,0.07)' }]}>
        <Text style={[cardStyles.bookBtnText, { color: isDark ? '#A2B8FF' : colors.navy }]}>Book</Text>
        <Ionicons name="arrow-forward" size={12} color={isDark ? '#A2B8FF' : colors.navy} />
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: 10,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  branch: { fontSize: 12 },
  pillsRow: { flexDirection: 'row', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 11, fontWeight: '600' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  bookBtnText: { fontSize: 12, fontWeight: '700' },
});

export function MyVenuesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();
  const { venues, isLoading, fetchOwnVenues, fetchMore } = useOwnerVenuesStore();

  useEffect(() => { fetchOwnVenues(); }, []);

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#060F28' : '#F4F6FB' }]}>
      <StatusBar barStyle="light-content" />
      <BackgroundShapes isDark={isDark} />

      <FlatList
        data={venues}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + 8 }]}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={() => fetchOwnVenues()} tintColor={colors.navy} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
              <Ionicons name="chevron-back" size={22} color={tc.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: tc.textPrimary }]}>My Venues</Text>
            <View style={{ width: 36 }} />
          </View>
        }
        renderItem={({ item }) => (
          <VenueCard
            venue={item}
            tc={tc}
            isDark={isDark}
            onPress={() => navigation.navigate('VenueDetail', { venueId: item.id })}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="football-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textHint }]}>No venues found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingBottom: 4 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
      android: { elevation: 2 },
    }),
  },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
