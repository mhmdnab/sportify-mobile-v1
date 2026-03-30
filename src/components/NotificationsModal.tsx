import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';
import { useNotificationsStore } from '../stores/notifications.store';
import { Notification, EntityType } from '../types/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const { notifications, isLoading, fetchNotifications, fetchMoreNotifications } = useNotificationsStore();

  const translateY = useSharedValue(MODAL_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 200,
        mass: 0.8,
      });
      backdropOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
    } else {
      translateY.value = withSpring(MODAL_HEIGHT, {
        damping: 22,
        stiffness: 220,
        mass: 0.7,
      });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const getIcon = (entityType?: EntityType): keyof typeof Ionicons.glyphMap => {
    switch (entityType) {
      case EntityType.RESERVATION: return 'calendar';
      case EntityType.BRANCH: return 'business';
      case EntityType.VENUE: return 'football';
      case EntityType.USER: return 'person';
      default: return 'notifications';
    }
  };

  const getIconColor = (entityType?: EntityType) => {
    switch (entityType) {
      case EntityType.RESERVATION: return colors.navy;
      case EntityType.BRANCH: return colors.navy;
      case EntityType.VENUE: return '#FF9500';
      default: return colors.textSecondary;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={[styles.notifItem, !item.isRead && styles.notifUnread]}>
      <View style={[styles.notifIcon, { backgroundColor: `${getIconColor(item.entityType)}15` }]}>
        <Ionicons name={getIcon(item.entityType)} size={18} color={getIconColor(item.entityType)} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifMessage, { color: tc.textPrimary }, !item.isRead && styles.notifMessageUnread]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.notifTime, { color: tc.textHint }]}>{getTimeAgo(item.createdAt)}</Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </View>
  );

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 20 }]} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.modal, { paddingBottom: insets.bottom || 20, backgroundColor: tc.cardBg }, modalStyle]}>
        {/* Handle bar */}
        <View style={[styles.handleBar, { backgroundColor: tc.border }]} />

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tc.border }]}>
          <Text style={[styles.title, { color: tc.textPrimary }]}>Notifications</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={tc.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {notifications.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${tc.textHint}15` }]}>
              <Ionicons name="notifications-off-outline" size={36} color={tc.textHint} />
            </View>
            <Text style={[styles.emptyTitle, { color: tc.textPrimary }]}>No notifications yet</Text>
            <Text style={[styles.emptyText, { color: tc.textHint }]}>You'll see updates about your bookings here</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderNotification}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            onEndReached={fetchMoreNotifications}
            onEndReachedThreshold={0.5}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: tc.border }]} />}
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.navy,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  notifUnread: {
    backgroundColor: 'rgba(11,26,62,0.03)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 3,
  },
  notifMessage: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  notifMessageUnread: {
    fontWeight: '600',
  },
  notifTime: {
    fontSize: 12,
    color: colors.textHint,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.navy,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textHint,
  },
});
