import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../theme/colors';
import { useThemeColors } from '../../../theme/useThemeColors';
import { useThemeStore } from '../../../stores/theme.store';
import { useOwnerBranchesStore } from '../../../stores/owner-branches.store';
import { spacing, radius } from '../../../theme/spacing';
import { BackgroundShapes } from '../../../components/ui/BackgroundShapes';
import { OwnerBranchesStackParamList } from '../../../types/navigation';
import { Branch } from '../../../types/api';

type Nav = NativeStackNavigationProp<OwnerBranchesStackParamList, 'OwnerBranchesList'>;

function BranchCard({ branch, onPress, tc, isDark, t }: { branch: Branch; onPress: () => void; tc: any; isDark: boolean; t: any }) {
  const imageUri = branch.images?.[0];

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
          <Ionicons name="business" size={28} color={isDark ? '#556080' : '#B0B5C5'} />
        </View>
      )}
      <View style={cardStyles.info}>
        <Text style={[cardStyles.name, { color: tc.textPrimary }]} numberOfLines={1}>
          {branch.name}
        </Text>
        <View style={cardStyles.row}>
          <Ionicons name="location-outline" size={13} color={tc.textHint} />
          <Text style={[cardStyles.sub, { color: tc.textSecondary }]} numberOfLines={1}>
            {branch.address?.city || 'No address'}
          </Text>
        </View>
        <View style={cardStyles.row}>
          <Ionicons name="football-outline" size={13} color={tc.textHint} />
          <Text style={[cardStyles.sub, { color: tc.textSecondary }]} numberOfLines={1}>
            {branch.sport?.name || 'Sport'}
          </Text>
        </View>
        <View style={cardStyles.footer}>
          <View style={[cardStyles.statusBadge, {
            backgroundColor: branch.isActive ? 'rgba(0,193,106,0.1)' : 'rgba(255,68,68,0.1)',
          }]}>
            <View style={[cardStyles.statusDot, {
              backgroundColor: branch.isActive ? '#00C16A' : '#FF4444',
            }]} />
            <Text style={[cardStyles.statusText, {
              color: branch.isActive ? '#00C16A' : '#FF4444',
            }]}>
              {branch.isActive ? t('owner.active') : t('owner.inactive')}
            </Text>
          </View>
          {branch.venues && (
            <Text style={[cardStyles.venueCount, { color: tc.textHint }]}>
              {branch.venues.length} {branch.venues.length !== 1 ? t('owner.venuesPlural') : t('owner.venue')}
            </Text>
          )}
        </View>
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  venueCount: {
    fontSize: 11,
  },
});

export function OwnerBranchesScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);
  const { branches, isLoading, fetchOwnBranches, fetchMore, hasNext } = useOwnerBranchesStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOwnBranches();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOwnBranches();
    setRefreshing(false);
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: tc.textPrimary }]}>{t('owner.myBranches')}</Text>
      </View>
      <FlatList
        data={branches}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <BranchCard
            branch={item}
            tc={tc}
            isDark={isDark}
            t={t}
            onPress={() => navigation.navigate('OwnerBranchDetail', { branchId: item.id })}
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
              <Ionicons name="business-outline" size={48} color={tc.textHint} />
              <Text style={[styles.emptyText, { color: tc.textSecondary }]}>{t('owner.noBranches')}</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
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
