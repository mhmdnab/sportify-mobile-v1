import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../theme/colors';
import { spacing } from '../../../theme/spacing';
import { Notification, EntityType } from '../../../types/api';
import { getRelativeTime } from '../../../utils/date';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
}

const entityIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  [EntityType.RESERVATION]: 'calendar',
  [EntityType.BRANCH]: 'business',
  [EntityType.VENUE]: 'football',
  [EntityType.USER]: 'person',
};

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const icon = (notification.entityType && entityIcons[notification.entityType]) || 'notifications';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, !notification.isRead && styles.unread]}
    >
      <View style={[styles.iconCircle, !notification.isRead && styles.unreadIcon]}>
        <Ionicons name={icon} size={20} color={notification.isRead ? colors.textHint : colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.message, !notification.isRead && styles.unreadText]} numberOfLines={2}>
          {notification.message}
        </Text>
        <Text style={styles.time}>{getRelativeTime(notification.createdAt)}</Text>
      </View>
      {!notification.isRead && <View style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  unread: {
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadIcon: {
    backgroundColor: `${colors.primary}15`,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  unreadText: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  time: {
    fontSize: 12,
    color: colors.textHint,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
