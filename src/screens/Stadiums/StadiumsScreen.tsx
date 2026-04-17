import React, { useEffect, useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing, radius } from '../../theme/spacing';
import { useSportsStore } from '../../stores/sports.store';
import { useBranchesStore } from '../../stores/branches.store';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { SportChip } from '../Home/components/SportChip';
import { Branch } from '../../types/api';
import { HomeStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<HomeStackParamList, 'StadiumsScreen'>;

function BranchListCard({ branch, onPress, tc, isDark }: {
  branch: Branch;
  onPress: () => void;
  tc: any;
  isDark: boolean;
}) {
  const imageUri = branch.images?.[0];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[cardStyles.card, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}
    >
      {/* Image */}
      <View style={cardStyles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={cardStyles.image} contentFit="cover" />
        ) : (
          <View style={[cardStyles.image, cardStyles.imagePlaceholder]}>
            <Ionicons name="football-outline" size={32} color={colors.textHint} />
          </View>
        )}
        {branch.isFeatured && (
          <View style={cardStyles.featuredBadge}>
            <Ionicons name="star" size={11} color="#FFD700" />
            <Text style={cardStyles.featuredText}>Featured</Text>
          </View>
        )}
        {branch.sport && (
          <View style={cardStyles.sportBadge}>
            <Text style={cardStyles.sportBadgeText}>{branch.sport.name}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={cardStyles.info}>
        <Text style={[cardStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>
          {branch.name}
        </Text>

        {branch.address && (
          <View style={cardStyles.locationRow}>
            <Ionicons name="location" size={13} color={colors.navy} />
            <Text style={[cardStyles.location, { color: tc.textSecondary }]} numberOfLines={1}>
              {branch.address.city}{branch.address.street ? `, ${branch.address.street}` : ''}
            </Text>
          </View>
        )}

        <View style={cardStyles.bottomRow}>
          {branch.venues && branch.venues.length > 0 && (
            <View style={cardStyles.venueCountPill}>
              <Ionicons name="grid-outline" size={11} color="#0B1A3E" />
              <Text style={cardStyles.venueCountText}>
                {branch.venues.length} {branch.venues.length === 1 ? 'court' : 'courts'}
              </Text>
            </View>
          )}
          <View style={[cardStyles.bookBtn]}>
            <Text style={cardStyles.bookBtnText}>View & Book</Text>
            <Ionicons name="arrow-forward" size={12} color={colors.navy} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginBottom: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  imageWrap: {
    position: 'relative',
    width: '100%',
    height: 160,
    backgroundColor: colors.surface,
  },
  image: { width: '100%', height: 160 },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  featuredText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
  sportBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: colors.navy,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sportBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  info: { padding: 14 },
  name: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  location: { fontSize: 13, flex: 1 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  venueCountPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(11,26,62,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  venueCountText: { color: '#0B1A3E', fontSize: 12, fontWeight: '600' },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(6,15,40,0.07)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  bookBtnText: { color: colors.navy, fontSize: 12, fontWeight: '700' },
});

export function StadiumsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { sports, fetchSports } = useSportsStore();
  const { branches, fetchBranches, isLoading } = useBranchesStore();
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSports();
    fetchBranches();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSports(), fetchBranches()]);
    setRefreshing(false);
  };

  const handleSportPress = (sportId: number) => {
    setSelectedSportId((prev) => (prev === sportId ? null : sportId));
  };

  const filteredBranches = selectedSportId
    ? branches.filter((b) => b.sportId === selectedSportId)
    : branches;

  const headerEl = (
    <>
      {/* Minimal header */}
      <View style={[headerStyles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[headerStyles.backBtn, { backgroundColor: isDark ? '#0C1832' : '#FFFFFF' }]}>
          <Ionicons name="chevron-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[headerStyles.title, { color: tc.textPrimary }]}>Stadiums</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Sport chips */}
      <FlatList
        data={sports}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => String(s.id)}
        contentContainerStyle={headerStyles.chips}
        renderItem={({ item }) => (
          <SportChip
            sport={item}
            isSelected={selectedSportId === item.id}
            onPress={() => handleSportPress(item.id)}
          />
        )}
        style={headerStyles.chipsList}
      />

      {/* Count */}
      <View style={headerStyles.countRow}>
        <Text style={[headerStyles.count, { color: tc.textSecondary }]}>
          {filteredBranches.length} {filteredBranches.length === 1 ? 'location' : 'locations'}
          {selectedSportId ? ` · ${sports.find((s) => s.id === selectedSportId)?.name ?? ''}` : ''}
        </Text>
      </View>
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: isDark ? '#060F28' : '#F4F6FB' }]}>
      <StatusBar barStyle="light-content" />
      <BackgroundShapes isDark={isDark} />

      <FlatList
        data={filteredBranches}
        keyExtractor={(b) => String(b.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={headerEl}
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} tintColor={colors.navy} />}
        renderItem={({ item }) => (
          <BranchListCard
            branch={item}
            tc={tc}
            isDark={isDark}
            onPress={() => navigation.navigate('BranchDetail', { branchId: item.id })}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="american-football-outline" size={52} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textHint }]}>No stadiums found</Text>
            </View>
          ) : null
        }
      />
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
  chipsList: { flexGrow: 0 },
  chips: { paddingHorizontal: spacing.screenPadding, paddingVertical: 10, gap: 8 },
  countRow: { paddingHorizontal: spacing.screenPadding, paddingBottom: 8 },
  count: { fontSize: 13, fontWeight: '500' },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: spacing.screenPadding, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
});
