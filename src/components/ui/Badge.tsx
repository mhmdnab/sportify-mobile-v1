import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface BadgeProps {
  count: number;
  size?: number;
}

export function Badge({ count, size = 18 }: BadgeProps) {
  if (count <= 0) return null;

  return (
    <View style={[styles.badge, { minWidth: size, height: size, borderRadius: size / 2 }]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    position: 'absolute',
    top: -6,
    right: -6,
  },
  text: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
