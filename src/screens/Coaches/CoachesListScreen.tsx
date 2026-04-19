import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing, radius } from '../../theme/spacing';
import { colors } from '../../theme/colors';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { SportChip } from '../Home/components/SportChip';
import { useSportsStore } from '../../stores/sports.store';
import { Coach, Sport } from '../../types/api';
import { api } from '../../lib/api';
import { useAssistantStore } from '../../stores/assistant.store';
import { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'CoachesList'>;

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  const r = Math.round(rating ?? 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= r ? 'star' : 'star-outline'} size={size} color="#F59E0B" />
      ))}
    </View>
  );
}

function CoachCard({ coach, onPress, tc, isDark }: {
  coach: Coach;
  onPress: () => void;
  tc: any;
  isDark: boolean;
}) {
  const avgRating = (coach as any)._avg?.rating ?? coach.avgRating ?? 0;
  const reviewCount = (coach as any)._count?.reviews ?? coach.reviewCount ?? 0;
  const venueCount = coach.availabilities?.length ?? 0;
  const initial = (coach.user?.name ?? 'C').charAt(0).toUpperCase();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[cardStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
    >
      {/* Left avatar */}
      <View style={cardStyles.avatarWrap}>
        <View style={cardStyles.avatar}>
          <Text style={cardStyles.avatarText}>{initial}</Text>
        </View>
        {/* Online dot style – active indicator */}
        <View style={[cardStyles.activeDot, { backgroundColor: '#22C55E' }]} />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={[cardStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>
          {coach.user?.name ?? `Coach #${coach.id}`}
        </Text>

        {coach.sport && (
          <View style={cardStyles.sportPill}>
            <Text style={cardStyles.sportPillText}>{coach.sport}</Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <StarRow rating={avgRating} />
          {reviewCount > 0 && (
            <Text style={[cardStyles.ratingCount, { color: tc.textHint }]}>({reviewCount})</Text>
          )}
        </View>

        {venueCount > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="location-outline" size={11} color={tc.textHint} />
            <Text style={[cardStyles.meta, { color: tc.textHint }]}>
              {venueCount} {venueCount === 1 ? 'venue' : 'venues'}
            </Text>
          </View>
        )}
      </View>

      {/* Right: rate */}
      <View style={cardStyles.right}>
        <Text style={cardStyles.rate}>${coach.hourlyRate ?? 0}</Text>
        <Text style={[cardStyles.perHr, { color: tc.textHint }]}>/hr</Text>
        <View style={cardStyles.bookBtn}>
          <Text style={cardStyles.bookBtnText}>Book</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(11,26,62,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#0B1A3E' },
  activeDot: { position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: '#FFFFFF' },
  name: { fontSize: 15, fontWeight: '700' },
  sportPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,26,62,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  sportPillText: { color: '#0B1A3E', fontSize: 11, fontWeight: '700' },
  ratingCount: { fontSize: 11 },
  meta: { fontSize: 11 },
  right: { alignItems: 'center', gap: 2 },
  rate: { fontSize: 18, fontWeight: '800', color: '#0B1A3E' },
  perHr: { fontSize: 10 },
  bookBtn: {
    marginTop: 6,
    backgroundColor: '#0B1A3E',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  bookBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// "All" pseudo-sport pill
function AllChip({ isSelected, onPress, tc }: { isSelected: boolean; onPress: () => void; tc: any }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[allChipStyles.chip, { backgroundColor: tc.cardBg, borderColor: tc.border }, isSelected && allChipStyles.selected]}
    >
      <Ionicons name="apps" size={16} color={isSelected ? '#fff' : tc.textPrimary} style={{ marginRight: 6 }} />
      <Text style={[allChipStyles.label, { color: tc.textPrimary }, isSelected && allChipStyles.selectedLabel]}>
        All
      </Text>
    </TouchableOpacity>
  );
}

const allChipStyles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  selected: {
    borderColor: colors.navy,
    backgroundColor: colors.navy,
    ...Platform.select({
      ios: { shadowColor: colors.navy, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },
  label: { fontSize: 14, fontWeight: '600' },
  selectedLabel: { color: '#fff' },
});

export function CoachesListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { sports, fetchSports } = useSportsStore();

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const setScreen = useAssistantStore((s) => s.setScreen);

  useEffect(() => {
    fetchSports();
    fetchCoaches('', null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setScreen('coaches');
      return () => setScreen('general');
    }, []),
  );

  const fetchCoaches = useCallback(async (q: string, sportId: number | null) => {
    try {
      const params: any = { page: 1, limit: 50 };
      if (q.trim()) params.key = q.trim();
      if (sportId) {
        const sport = sports.find((s) => s.id === sportId);
        if (sport) params.sport = sport.name;
      }
      const res = await api.get<any>('/coaches', { params });
      const list = res.data?.list ?? res.data?.data?.list ?? [];
      setCoaches(list);
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sports]);

  const handleSearch = (text: string) => {
    setSearch(text);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchCoaches(text, selectedSportId), 400);
  };

  const handleSport = (sportId: number | null) => {
    setSelectedSportId(sportId);
    fetchCoaches(search, sportId);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchCoaches(search, selectedSportId);
  };

  const selectedSportName = selectedSportId
    ? sports.find((s) => s.id === selectedSportId)?.name
    : null;

  const headerEl = (
    <>
      {/* Nav header */}
      <View style={[headerStyles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[headerStyles.backBtn, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <Ionicons name="chevron-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[headerStyles.title, { color: tc.textPrimary }]}>Coaches</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search bar */}
      <View style={[headerStyles.searchBar, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
        <Ionicons name="search-outline" size={17} color={tc.textHint} />
        <TextInput
          style={[headerStyles.searchInput, { color: tc.textPrimary }]}
          placeholder="Search coaches..."
          placeholderTextColor={tc.textHint}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={17} color={tc.textHint} />
          </TouchableOpacity>
        )}
      </View>

      {/* Sport chips */}
      <FlatList
        data={sports}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={headerStyles.chips}
        style={headerStyles.chipsList}
        ListHeaderComponent={
          <AllChip isSelected={selectedSportId === null} onPress={() => handleSport(null)} tc={tc} />
        }
        renderItem={({ item }) => (
          <SportChip
            sport={item}
            isSelected={selectedSportId === item.id}
            onPress={() => handleSport(item.id)}
          />
        )}
      />

      {/* Count */}
      <View style={headerStyles.countRow}>
        <Text style={[headerStyles.count, { color: tc.textSecondary }]}>
          {coaches.length} {coaches.length === 1 ? 'coach' : 'coaches'}
          {selectedSportName ? ` · ${selectedSportName}` : ''}
        </Text>
      </View>
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#060F28' : '#F4F6FB' }]}>
      <StatusBar barStyle="light-content" />
      <BackgroundShapes isDark={isDark} />

      {loading ? (
        <>
          {headerEl}
          <ActivityIndicator style={{ marginTop: 60 }} color="#0B1A3E" size="large" />
        </>
      ) : (
        <FlatList
          data={coaches}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={headerEl}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B1A3E" />}
          renderItem={({ item }) => (
            <CoachCard
              coach={item}
              tc={tc}
              isDark={isDark}
              onPress={() => navigation.navigate('CoachProfile', { coachId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="fitness-outline" size={52} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textHint }]}>No coaches found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 12,
  },
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenPadding,
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  searchInput: { flex: 1, fontSize: 15 },
  chipsList: { flexGrow: 0, marginTop: 4 },
  chips: { paddingHorizontal: spacing.screenPadding, paddingVertical: 10 },
  countRow: { paddingHorizontal: spacing.screenPadding, paddingBottom: 8 },
  count: { fontSize: 13, fontWeight: '500' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
