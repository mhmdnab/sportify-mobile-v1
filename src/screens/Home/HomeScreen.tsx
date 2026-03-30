import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ScrollView, StyleSheet, RefreshControl, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,

} from 'react-native-reanimated';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
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
import { useTranslation } from 'react-i18next';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';
import { useUIStore } from '../../stores/ui.store';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeScreen'>;

export function HomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { sports, fetchSports, isLoading: sportsLoading } = useSportsStore();
  const { branches, fetchBranches, isLoading: branchesLoading } = useBranchesStore();
  const fetchNotifications = useNotificationsStore((s) => s.fetchNotifications);
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const openNotifications = useUIStore((s) => s.openNotifications);
  const drawerVisible = useUIStore((s) => s.isDrawerOpen);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  // Main content animation when drawer opens
  const contentScale = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const contentBorderRadius = useSharedValue(0);

  useEffect(() => {
    const openConfig = { damping: 18, stiffness: 160, mass: 0.8 };
    const closeConfig = { damping: 22, stiffness: 200, mass: 0.7 };
    if (drawerVisible) {
      contentScale.value = withSpring(0.88, openConfig);
      contentTranslateX.value = withSpring(-80, openConfig);
      contentBorderRadius.value = withTiming(24, { duration: 350, easing: Easing.out(Easing.cubic) });
    } else {
      contentScale.value = withSpring(1, closeConfig);
      contentTranslateX.value = withSpring(0, closeConfig);
      contentBorderRadius.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.cubic) });
    }
  }, [drawerVisible]);

  const contentAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: contentScale.value },
      { translateX: contentTranslateX.value },
    ],
    borderRadius: contentBorderRadius.value,
    overflow: 'hidden' as const,
  }));

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

  const filteredBranches = selectedSportId
    ? branches.filter((b) => b.sportId === selectedSportId)
    : branches;

  const isLoading = sportsLoading && branchesLoading;

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? '#050505' : colors.navy }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <Animated.View style={[styles.container, { backgroundColor: tc.screenBg }, contentAnimStyle]}>
        <HomeHeader
          onNotificationPress={openNotifications}
          onSearchPress={() => (navigation as any).navigate('ExploreTab', { screen: 'ExploreScreen' })}
          onAvatarPress={openDrawer}
        />
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Background shapes scroll with content */}
          <BackgroundShapes isDark={isDark} />

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
                    style={{ overflow: 'visible' }}
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
              {filteredBranches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: tc.textPrimary }]}>{t('home.nearby')}</Text>
                    <Text
                      style={[styles.seeAll, { color: tc.textSecondary }]}
                      onPress={() => (navigation as any).navigate('ExploreTab', { screen: 'ExploreScreen' })}
                    >
                      {t('home.seeAll')}
                    </Text>
                  </View>
                  <View style={styles.listContainer}>
                    {filteredBranches.slice(0, 5).map((branch) => (
                      <BranchCard
                        key={branch.id}
                        branch={branch}
                        onPress={() => navigation.navigate('BranchDetail', { branchId: branch.id })}
                      />
                    ))}
                  </View>
                </View>
              )}

              <View style={{ height: 100 }} />
            </>
          )}
        </ScrollView>
      </Animated.View>

      <ProfileDrawer
        visible={drawerVisible}
        onClose={closeDrawer}
        onNavigate={handleDrawerNavigate}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  container: {
    flex: 1,
    backgroundColor: '#ECEDF3',
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
    color: colors.navy,
  },
  seeAll: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  horizontalList: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 8,
  },
  listContainer: {
    paddingHorizontal: spacing.screenPadding,
  },
});
