import React, { useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { spacing } from '../../theme/spacing';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { useNotificationsStore } from '../../stores/notifications.store';
import { NotificationItem } from './components/NotificationItem';
import { NotificationsSkeleton } from './components/NotificationsSkeleton';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';

export function NotificationsScreen() {
  const { notifications, isLoading, error, fetchNotifications, fetchMoreNotifications } = useNotificationsStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <Text style={[styles.title, { color: tc.textPrimary }]}>Notifications</Text>

      {isLoading && notifications.length === 0 ? (
        <NotificationsSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchNotifications} />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications"
          message="You're all caught up!"
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          onEndReached={fetchMoreNotifications}
          onEndReachedThreshold={0.5}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
          renderItem={({ item }) => (
            <NotificationItem notification={item} onPress={() => {}} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
});
