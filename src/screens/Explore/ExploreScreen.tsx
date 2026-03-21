import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import BottomSheet from '@gorhom/bottom-sheet';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { SearchBar } from '../../components/ui/SearchBar';
import { Chip } from '../../components/ui/Chip';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useVenuesStore } from '../../stores/venues.store';
import { useSportsStore } from '../../stores/sports.store';
import { api } from '../../lib/api';
import { VenueType, PaginatedResponse } from '../../types/api';
import { ExploreStackParamList } from '../../types/navigation';
import { VenueCard } from './components/VenueCard';
import { FilterBottomSheet } from './components/FilterBottomSheet';
import { ExploreSkeleton } from './components/ExploreSkeleton';

type Nav = NativeStackNavigationProp<ExploreStackParamList, 'ExploreScreen'>;

export function ExploreScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<ExploreStackParamList, 'ExploreScreen'>>();
  const { searchResults, isSearching, error, searchVenues, searchMore, clearSearch } = useVenuesStore();
  const { sports, fetchSports } = useSportsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSportId, setSelectedSportId] = useState<number | null>(
    route.params?.sportId ?? null,
  );
  const [selectedVenueTypeId, setSelectedVenueTypeId] = useState<number | null>(null);
  const [venueTypes, setVenueTypes] = useState<VenueType[]>([]);
  const [activeFilter, setActiveFilter] = useState<'sport' | 'venueType' | null>(null);

  const sportSheetRef = useRef<BottomSheet>(null);
  const venueTypeSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    fetchSports();
    loadVenueTypes();
    doSearch();
  }, []);

  useEffect(() => {
    doSearch();
  }, [selectedSportId, selectedVenueTypeId]);

  const loadVenueTypes = async () => {
    try {
      const res = await api.get<PaginatedResponse<VenueType>>('/venue-types', {
        params: { page: 1, limit: 50 },
      });
      setVenueTypes(res.data.list);
    } catch {}
  };

  const doSearch = useCallback(() => {
    searchVenues({
      key: searchQuery || undefined,
      sportId: selectedSportId || undefined,
      venueTypeId: selectedVenueTypeId || undefined,
    });
  }, [searchQuery, selectedSportId, selectedVenueTypeId]);

  const handleSearchSubmit = () => {
    doSearch();
  };

  const openFilter = (type: 'sport' | 'venueType') => {
    setActiveFilter(type);
    if (type === 'sport') sportSheetRef.current?.expand();
    else venueTypeSheetRef.current?.expand();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus={!route.params?.sportId}
          onPress={undefined}
          editable
        />
      </View>

      <View style={styles.filters}>
        <Chip
          label={selectedSportId ? sports.find((s) => s.id === selectedSportId)?.name || 'Sport' : 'Sport'}
          active={!!selectedSportId}
          onPress={() => openFilter('sport')}
        />
        <Chip
          label={
            selectedVenueTypeId
              ? venueTypes.find((v) => v.id === selectedVenueTypeId)?.name || 'Venue Type'
              : 'Venue Type'
          }
          active={!!selectedVenueTypeId}
          onPress={() => openFilter('venueType')}
        />
        <Chip label="Search" onPress={handleSearchSubmit} />
      </View>

      {isSearching && searchResults.length === 0 ? (
        <ExploreSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={doSearch} />
      ) : searchResults.length === 0 ? (
        <EmptyState icon="search-outline" title="No venues found" message="Try adjusting your filters" />
      ) : (
        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={searchMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => (
            <VenueCard
              venue={item}
              onPress={() => navigation.navigate('VenueDetail', { venueId: item.id })}
            />
          )}
        />
      )}

      <FilterBottomSheet
        ref={sportSheetRef}
        title="Select Sport"
        options={sports}
        selectedId={selectedSportId}
        onSelect={(id) => {
          setSelectedSportId(id);
          sportSheetRef.current?.close();
        }}
      />
      <FilterBottomSheet
        ref={venueTypeSheetRef}
        title="Select Venue Type"
        options={venueTypes}
        selectedId={selectedVenueTypeId}
        onSelect={(id) => {
          setSelectedVenueTypeId(id);
          venueTypeSheetRef.current?.close();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
  },
});
