import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useOwnerVenuesStore } from '../../../stores/owner-venues.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { OwnerVenuesStackParamList } from '../../../types/navigation';
import { Venue } from '../../../types/api';

type Nav = NativeStackNavigationProp<OwnerVenuesStackParamList, 'OwnerVenuesList'>;

function VenueCard({ venue, onPress, tc, isDark, t }: { venue: Venue; onPress: () => void; tc: any; isDark: boolean; t: any }) {
  const imageUri = venue.images?.[0];
  const typeNames = venue.venueTypes?.map((t) => t.name).join(', ');

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[cardStyles.container, { backgroundColor: tc.cardBg }]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={cardStyles.image} />
      ) : (
        <View style={[cardStyles.imagePlaceholder, { backgroundColor: isDark ? colors.navyLight : '#E8EAF0' }]}>
          <Ionicons name="football" size={28} color={isDark ? '#556080' : '#B0B5C5'} />
        </View>
      )}
      <View style={cardStyles.info}>
        <Text style={[cardStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>
          {venue.name}
        </Text>
        {venue.branch && (
          <View style={cardStyles.row}>
            <Ionicons name="business-outline" size={13} color={tc.textHint} />
            <Text style={[cardStyles.sub, { color: tc.textSecondary }]} numberOfLines={1}>
              {venue.branch.name}
            </Text>
          </View>
        )}
        <View style={cardStyles.row}>
          <Ionicons name="people-outline" size={13} color={tc.textHint} />
          <Text style={[cardStyles.sub, { color: tc.textSecondary }]}>
            {venue.playerCapacity} {t('owner.players')}
          </Text>
        </View>
        {typeNames ? (
          <View style={cardStyles.row}>
            <Ionicons name="pricetag-outline" size={13} color={tc.textHint} />
            <Text style={[cardStyles.sub, { color: tc.textSecondary }]} numberOfLines={1}>
              {typeNames}
            </Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={tc.textHint} />
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    gap: 3,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sub: {
    fontSize: 13,
  },
});

export function OwnerVenuesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { venues, isLoading, fetchOwnVenues, fetchMore, hasNext } = useOwnerVenuesStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOwnVenues();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOwnVenues();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>{t('owner.myVenues')}</Text>
      </View>
      <FlatList
        data={venues}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <VenueCard
            venue={item}
            tc={tc}
            isDark={isDark}
            t={t}
            onPress={() => navigation.navigate('OwnerVenueDetail', { venueId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasNext && fetchMore()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tc.textSecondary} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="football-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>{t('owner.noVenues')}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  list: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 100,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
