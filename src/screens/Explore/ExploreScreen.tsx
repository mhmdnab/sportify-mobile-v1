import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { spacing } from '../../theme/spacing';
import { useVenuesStore } from '../../stores/venues.store';
import { useSportsStore } from '../../stores/sports.store';
import { useBranchesStore } from '../../stores/branches.store';
import { api } from '../../lib/api';
import { Venue, VenueType, Branch, PaginatedResponse } from '../../types/api';
import { ExploreStackParamList } from '../../types/navigation';
import { FilterBottomSheet } from './components/FilterBottomSheet';
import { SportIcon } from '../../components/ui/SportIcon';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { useThemeStore } from '../../stores/theme.store';
import { useTranslation } from 'react-i18next';

type Nav = NativeStackNavigationProp<ExploreStackParamList, 'ExploreScreen'>;

const SEARCH_HISTORY_KEY = 'sportify_search_history';
const MAX_HISTORY = 8;

export function ExploreScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<ExploreStackParamList, 'ExploreScreen'>>();
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { searchResults, isSearching, searchVenues, searchMore, clearSearch } = useVenuesStore();
  const { sports, fetchSports } = useSportsStore();
  const { branches, fetchBranches } = useBranchesStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportId, setSelectedSportId] = useState<number | null>(
    route.params?.sportId ?? null,
  );
  const [selectedVenueTypeId, setSelectedVenueTypeId] = useState<number | null>(null);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(!!route.params?.sportId);

  const inputRef = useRef<TextInput>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sportSheetRef = useRef<BottomSheet>(null);
  const venueTypeSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    loadHistory();
    fetchSports();
    fetchBranches({ limit: 50 });
    loadVenueTypes();
  }, []);

  // Reset screen state when tab is focused (but keep search history)
  useFocusEffect(
    React.useCallback(() => {
      // Only reset if we weren't navigated here with a sportId
      if (!route.params?.sportId) {
        setIsActive(false);
        setSearchQuery('');
        setSelectedSportId(null);
        setSelectedVenueTypeId(null);
        clearSearch();
      }
      loadHistory();
    }, [route.params?.sportId]),
  );

  // Incoming sportId from navigation
  useEffect(() => {
    if (route.params?.sportId !== undefined) {
      setSelectedSportId(route.params.sportId);
      setIsActive(true);
      searchVenues({ sportId: route.params.sportId });
    }
  }, [route.params?.sportId]);

  // Re-search when filters change (only if active)
  useEffect(() => {
    if (isActive) {
      searchVenues({
        key: searchQuery || undefined,
        sportId: selectedSportId || undefined,
        venueTypeId: selectedVenueTypeId || undefined,
      });
    }
  }, [selectedSportId, selectedVenueTypeId]);

  const loadVenueTypes = async () => {
    try {
      const res = await api.get<PaginatedResponse<VenueType>>('/venue-types', {
        params: { page: 1, limit: 50 },
      });
      setVenueTypes(res.data.list);
    } catch {}
  };

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (raw) setSearchHistory(JSON.parse(raw));
    } catch {}
  };

  const saveToHistory = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...searchHistory.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY);
    setSearchHistory(updated);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const removeFromHistory = async (query: string) => {
    const updated = searchHistory.filter((h) => h !== query);
    setSearchHistory(updated);
    await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const clearAllHistory = async () => {
    setSearchHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // Live search with debounce
  const handleTextChange = (text: string) => {
    setSearchQuery(text);
    if (!isActive) setIsActive(true);

    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (text.trim()) {
        searchVenues({
          key: text.trim(),
          sportId: selectedSportId || undefined,
          venueTypeId: selectedVenueTypeId || undefined,
        });
      } else {
        clearSearch();
      }
    }, 350);
  };

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (searchQuery.trim()) {
      saveToHistory(searchQuery.trim());
      searchVenues({
        key: searchQuery.trim(),
        sportId: selectedSportId || undefined,
        venueTypeId: selectedVenueTypeId || undefined,
      });
    }
  };

  const handleHistoryTap = (query: string) => {
    setSearchQuery(query);
    setIsActive(true);
    Keyboard.dismiss();
    saveToHistory(query);
    searchVenues({
      key: query,
      sportId: selectedSportId || undefined,
      venueTypeId: selectedVenueTypeId || undefined,
    });
  };

  const handleActivate = () => {
    setIsActive(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClear = () => {
    setSearchQuery('');
    clearSearch();
    inputRef.current?.focus();
  };

  const handleBack = () => {
    setIsActive(false);
    setSearchQuery('');
    clearSearch();
    Keyboard.dismiss();
  };

  // Filter branches by sport and/or search query
  const filteredBranches = branches.filter((b) => {
    if (selectedSportId && b.sportId !== selectedSportId) return false;
    if (searchQuery.trim()) {
      return b.name.toLowerCase().includes(searchQuery.trim().toLowerCase());
    }
    return true;
  });

  const hasActiveSearch = searchQuery.trim().length > 0 || searchResults.length > 0 || filteredBranches.length > 0;
  const showRecentSearches = isActive && !searchQuery.trim() && !hasActiveSearch;
  const showResults = isActive && hasActiveSearch;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      {/* Search Header */}
      <View style={styles.header}>
        {isActive ? (
          <View style={styles.activeSearchRow}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={tc.textPrimary} />
            </TouchableOpacity>
            <View style={[styles.activeSearchBar, { backgroundColor: tc.cardBg }]}>
              <Ionicons name="search" size={18} color={tc.textHint} />
              <TextInput
                ref={inputRef}
                value={searchQuery}
                onChangeText={handleTextChange}
                placeholder={t('explore.searchPlaceholder')}
                placeholderTextColor={tc.textHint}
                style={[styles.searchInput, { color: tc.textPrimary }]}
                returnKeyType="search"
                onSubmitEditing={handleSubmit}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="close-circle" size={18} color={tc.textHint} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={handleActivate} activeOpacity={0.8} style={[styles.inactiveSearchBar, { backgroundColor: tc.cardBg }]}>
            <Ionicons name="search" size={20} color={tc.textHint} />
            <Text style={[styles.inactivePlaceholder, { color: tc.textHint }]}>{t('explore.searchPlaceholder')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips — always visible when active */}
      {isActive && (
        <View style={styles.filtersWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
            keyboardShouldPersistTaps="handled"
          >
            <FilterChip
              label={t('explore.allSports')}
              active={!selectedSportId}
              onPress={() => {
                setSelectedSportId(null);
                searchVenues({
                  key: searchQuery || undefined,
                  venueTypeId: selectedVenueTypeId || undefined,
                });
              }}
            />
            {sports.map((sport) => (
              <FilterChip
                key={sport.id}
                label={sport.name}
                sportName={sport.name}
                active={selectedSportId === sport.id}
                onPress={() => setSelectedSportId(selectedSportId === sport.id ? null : sport.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Content */}
      {!isActive ? (
        // Idle state
        <View style={styles.idleState}>
          <View style={styles.idleIconWrap}>
            <Ionicons name="search" size={44} color={tc.textPrimary} />
          </View>
          <Text style={[styles.idleTitle, { color: tc.textPrimary }]}>{t('explore.findYourVenue')}</Text>
          <Text style={[styles.idleSubtitle, { color: tc.textSecondary }]}>
            {t('explore.searchDescription')}
          </Text>

          {/* Sport quick access */}
          {sports.length > 0 && (
            <View style={styles.sportGrid}>
              {sports.slice(0, 6).map((sport) => (
                <TouchableOpacity
                  key={sport.id}
                  style={styles.sportGridItem}
                  activeOpacity={0.7}
                  onPress={() => {
                    setSelectedSportId(sport.id);
                    setIsActive(true);
                    searchVenues({ sportId: sport.id });
                  }}
                >
                  <View style={[styles.sportGridImage, styles.sportGridPlaceholder, { backgroundColor: tc.cardBg }]}>
                    <SportIcon sportName={sport.name} size={22} color={tc.textSecondary} />
                  </View>
                  <Text style={[styles.sportGridLabel, { color: tc.textSecondary }]} numberOfLines={1}>{sport.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : showRecentSearches ? (
        // Recent searches
        <ScrollView
          style={styles.recentContainer}
          contentContainerStyle={styles.recentContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {searchHistory.length > 0 && (
            <>
              <View style={styles.recentHeader}>
                <Text style={[styles.recentTitle, { color: tc.textPrimary }]}>{t('explore.recentSearches')}</Text>
                <TouchableOpacity onPress={clearAllHistory}>
                  <Text style={styles.clearText}>{t('explore.clear')}</Text>
                </TouchableOpacity>
              </View>
              {searchHistory.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.recentItem, { borderBottomColor: tc.border }]}
                  onPress={() => handleHistoryTap(item)}
                  activeOpacity={0.6}
                >
                  <View style={styles.recentItemLeft}>
                    <Ionicons name="time-outline" size={18} color={tc.textHint} />
                    <Text style={[styles.recentItemText, { color: tc.textPrimary }]} numberOfLines={1}>{item}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFromHistory(item)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={16} color={tc.textHint} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </>
          )}

          {searchHistory.length === 0 && (
            <View style={styles.noHistoryWrap}>
              <Ionicons name="time-outline" size={36} color={tc.border} />
              <Text style={[styles.noHistoryText, { color: tc.textHint }]}>{t('explore.noRecentSearches')}</Text>
            </View>
          )}
        </ScrollView>
      ) : showResults ? (
        // Search results
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          onEndReached={searchMore}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListHeaderComponent={
            <>
              {/* Branch results */}
              {filteredBranches.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>{t('explore.branches')}</Text>
                  {filteredBranches.map((branch) => (
                    <BranchResultCard
                      key={branch.id}
                      branch={branch}
                      sport={sports.find((s) => s.id === branch.sportId)}
                      onPress={() => navigation.navigate('BranchDetail', { branchId: branch.id })}
                    />
                  ))}
                </View>
              )}

              {/* Venues header */}
              {searchResults.length > 0 && (
                <Text style={[styles.sectionLabel, { color: tc.textPrimary }]}>{t('explore.venues')}</Text>
              )}
            </>
          }
          renderItem={({ item }) => (
            <VenueResultCard
              venue={item}
              onPress={() => navigation.navigate('VenueDetail', { venueId: item.id })}
            />
          )}
          ListEmptyComponent={
            isSearching ? (
              <View style={styles.loadingWrap}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeleton}>
                    <View style={styles.skelImage} />
                    <View style={styles.skelInfo}>
                      <View style={[styles.skelLine, { width: '65%' }]} />
                      <View style={[styles.skelLine, { width: '45%' }]} />
                      <View style={[styles.skelLine, { width: '35%' }]} />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={40} color={tc.textHint} />
                <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>{t('explore.noResults')}</Text>
                <Text style={[styles.emptyText, { color: tc.textSecondary }]}>{t('explore.tryDifferent')}</Text>
              </View>
            )
          }
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      ) : null}

      <FilterBottomSheet
        ref={sportSheetRef}
        title={t('explore.selectSport')}
        options={sports}
        selectedId={selectedSportId}
        onSelect={(id) => {
          setSelectedSportId(id);
          sportSheetRef.current?.close();
        }}
      />
      <FilterBottomSheet
        ref={venueTypeSheetRef}
        title={t('explore.selectVenueType')}
        options={venueTypes}
        selectedId={selectedVenueTypeId}
        onSelect={(id) => {
          setSelectedVenueTypeId(id);
          venueTypeSheetRef.current?.close();
        }}
      />
    </View>
  );
}

/* ───── Filter Chip ───── */
function FilterChip({
  label,
  active,
  sportName,
  onPress,
}: {
  label: string;
  active: boolean;
  sportName?: string;
  onPress: () => void;
}) {
  const tc = useThemeColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, { backgroundColor: tc.cardBg, borderColor: tc.border }, active && styles.chipActive]}
    >
      {sportName ? (
        <SportIcon sportName={sportName} size={16} color={active ? colors.white : tc.textSecondary} />
      ) : null}
      <Text style={[styles.chipText, { color: tc.textSecondary }, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

/* ───── Branch Result Card ───── */
function BranchResultCard({
  branch,
  sport,
  onPress,
}: {
  branch: Branch;
  sport?: { name: string; image: string };
  onPress: () => void;
}) {
  const tc = useThemeColors();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.resultCard, { backgroundColor: tc.cardBg }]}>
      {branch.images?.[0] ? (
        <Image source={{ uri: branch.images[0] }} style={styles.resultImage} contentFit="cover" />
      ) : (
        <View style={[styles.resultImage, styles.resultImageFallback, { backgroundColor: tc.surface }]}>
          <Ionicons name="business-outline" size={24} color={tc.textHint} />
        </View>
      )}
      <View style={styles.resultBody}>
        <Text style={[styles.resultName, { color: tc.textPrimary }]} numberOfLines={1}>{branch.name}</Text>
        {sport && <Text style={styles.resultSport}>{sport.name}</Text>}
        {branch.address && (
          <View style={styles.resultRow}>
            <Ionicons name="location-outline" size={13} color={tc.textHint} />
            <Text style={[styles.resultDetail, { color: tc.textHint }]} numberOfLines={1}>
              {[branch.address.city, branch.address.country].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={tc.textHint} />
    </TouchableOpacity>
  );
}

/* ───── Venue Result Card ───── */
function VenueResultCard({ venue, onPress }: { venue: Venue; onPress: () => void }) {
  const tc = useThemeColors();
  const lowestPrice = venue.availability
    ?.flatMap((a) => a.slots || [])
    .reduce((min, s) => (s.price < min ? s.price : min), Infinity);
  const price = lowestPrice && lowestPrice !== Infinity
    ? `${lowestPrice.toLocaleString()} L.L/h`
    : null;
  const typeName = venue.venueTypes?.[0]?.name;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.resultCard, { backgroundColor: tc.cardBg }]}>
      {venue.images?.[0] ? (
        <Image source={{ uri: venue.images[0] }} style={styles.resultImage} contentFit="cover" />
      ) : (
        <View style={[styles.resultImage, styles.resultImageFallback, { backgroundColor: tc.surface }]}>
          <Ionicons name="football-outline" size={24} color={tc.textHint} />
        </View>
      )}
      <View style={styles.resultBody}>
        <Text style={[styles.resultName, { color: tc.textPrimary }]} numberOfLines={1}>{venue.name}</Text>
        {venue.branch && (
          <Text style={styles.resultSport} numberOfLines={1}>{venue.branch.name}</Text>
        )}
        <View style={styles.resultMetaRow}>
          <View style={styles.resultRow}>
            <Ionicons name="people-outline" size={13} color={tc.textHint} />
            <Text style={[styles.resultDetail, { color: tc.textHint }]}>{venue.playerCapacity}</Text>
          </View>
          {price && (
            <View style={styles.resultRow}>
              <Ionicons name="card-outline" size={13} color={tc.textHint} />
              <Text style={[styles.resultDetail, { color: tc.textHint }]}>{price}</Text>
            </View>
          )}
          {typeName && (
            <View style={[styles.typeBadge, { backgroundColor: `${tc.textHint}15` }]}>
              <Text style={[styles.typeBadgeText, { color: tc.textSecondary }]}>{typeName}</Text>
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={tc.textHint} />
    </TouchableOpacity>
  );
}

/* ───── Styles ───── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEDF3',
  },

  // Header
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 6,
    paddingBottom: 8,
  },
  inactiveSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  inactivePlaceholder: {
    fontSize: 15,
    color: colors.textHint,
  },
  activeSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
  },
  activeSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    marginLeft: 10,
    paddingVertical: 0,
  },

  // Filters
  filtersWrap: {
    height: 48,
  },
  filtersRow: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 34,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.white,
  },

  // Idle state
  idleState: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  idleIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(11,26,62,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  idleTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 8,
  },
  idleSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
  },
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  sportGridItem: {
    alignItems: 'center',
    width: 72,
  },
  sportGridImage: {
    width: 52,
    height: 52,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
  },
  sportGridPlaceholder: {
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportGridLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Recent searches
  recentContainer: {
    flex: 1,
  },
  recentContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navy,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.navy,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  recentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  recentItemText: {
    fontSize: 15,
    color: colors.textPrimary,
    flex: 1,
  },
  noHistoryWrap: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noHistoryText: {
    fontSize: 14,
    color: colors.textHint,
    marginTop: 10,
  },

  // Results
  resultsList: {
    paddingHorizontal: spacing.screenPadding,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
    marginBottom: 10,
    marginTop: 4,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  resultImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  resultImageFallback: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultBody: {
    flex: 1,
    marginLeft: 12,
    gap: 3,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  resultSport: {
    fontSize: 13,
    color: colors.navy,
    fontWeight: '500',
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  resultDetail: {
    fontSize: 12,
    color: colors.textHint,
  },
  typeBadge: {
    backgroundColor: 'rgba(11,26,62,0.06)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navy,
  },

  // Loading
  loadingWrap: {
    gap: 10,
    paddingTop: 8,
  },
  skeleton: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
  },
  skelImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  skelInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 10,
  },
  skelLine: {
    height: 10,
    backgroundColor: colors.surface,
    borderRadius: 5,
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 14,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
});
