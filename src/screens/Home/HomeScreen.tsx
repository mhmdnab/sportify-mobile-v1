import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { useSportsStore } from '../../stores/sports.store';
import { useBranchesStore } from '../../stores/branches.store';
import { useNotificationsStore } from '../../stores/notifications.store';
import { HomeStackParamList } from '../../types/navigation';
import { HomeHeader } from './components/HomeHeader';
import { SportChip } from './components/SportChip';
import { BranchCard } from './components/BranchCard';
import { HomeSkeleton } from './components/HomeSkeleton';
import { ProfileDrawer } from '../../components/ProfileDrawer';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { sports, fetchSports, isLoading: sportsLoading } = useSportsStore();
  const { branches, fetchBranches, isLoading: branchesLoading } = useBranchesStore();
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const loadData = async () => {
    fetchSports();
    fetchBranches();
    fetchNotifications();
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSportPress = (sportId: number) => {
    setSelectedSportId(selectedSportId === sportId ? null : sportId);
    (navigation as any).navigate('ExploreTab', {
      screen: 'ExploreScreen',
      params: { sportId },
    });
  };

  const handleDrawerNavigate = (screen: string) => {
    switch (screen) {
      case 'profile':
        (navigation as any).navigate('ProfileTab', { screen: 'ProfileScreen' });
        break;
      case 'bookings':
        (navigation as any).navigate('BookingsTab');
        break;
      case 'notifications':
        (navigation as any).navigate('BookingsTab');
        break;
      case 'faqs':
        (navigation as any).navigate('ProfileTab', { screen: 'FAQs' });
        break;
      case 'terms':
        (navigation as any).navigate('ProfileTab', { screen: 'Terms' });
        break;
      case 'privacy':
        (navigation as any).navigate('ProfileTab', { screen: 'Privacy' });
        break;
      case 'logout':
        (navigation as any).reset({ index: 0, routes: [{ name: 'Auth' }] });
        break;
    }
  };

  const isLoading = sportsLoading && branchesLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeader
        onNotificationPress={() => {
          (navigation as any).navigate('BookingsTab');
        }}
        onSearchPress={() => (navigation as any).navigate('ExploreTab', { screen: 'ExploreScreen' })}
        onAvatarPress={() => setDrawerVisible(true)}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* Sports Categories */}
            {sports.length > 0 && (
              <View style={styles.section}>
                <FlatList
                  data={sports}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <SportChip
                      sport={item}
                      isSelected={selectedSportId === item.id}
                      onPress={() => handleSportPress(item.id)}
                    />
                  )}
                />
              </View>
            )}

            {/* Nearby Branches */}
            {branches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Nearby</Text>
                  <Text
                    style={styles.seeAll}
                    onPress={() => (navigation as any).navigate('ExploreTab', { screen: 'ExploreScreen' })}
                  >
                    See all
                  </Text>
                </View>
                <View style={styles.listContainer}>
                  {branches.slice(0, 5).map((branch) => (
                    <BranchCard
                      key={branch.id}
                      branch={branch}
                      onPress={() => navigation.navigate('BranchDetail', { branchId: branch.id })}
                    />
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>

      <ProfileDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onNavigate={handleDrawerNavigate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F5',
  },
  scrollContent: {
    paddingTop: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  seeAll: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
  },
  listContainer: {
    paddingHorizontal: spacing.screenPadding,
  },
});
