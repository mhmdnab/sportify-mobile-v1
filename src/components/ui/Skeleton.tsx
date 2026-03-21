import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

function SkeletonBox({ style }: { style?: ViewStyle }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { backgroundColor: colors.surface, opacity },
        style,
      ]}
    />
  );
}

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export function SkeletonLine({ width = '100%', height = 16, style }: SkeletonLineProps) {
  return (
    <SkeletonBox
      style={{
        width: width as any,
        height,
        borderRadius: 4,
        marginBottom: spacing.sm,
        ...((style as any) || {}),
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <SkeletonBox
      style={{
        width: '100%',
        height: 180,
        borderRadius: radius.card,
        marginBottom: spacing.lg,
      }}
    />
  );
}

export function SkeletonListItem() {
  return (
    <View style={skStyles.listItem}>
      <SkeletonBox style={{ width: 80, height: 80, borderRadius: radius.input }} />
      <View style={skStyles.listItemContent}>
        <SkeletonBox style={{ width: '70%', height: 18, borderRadius: 4 }} />
        <SkeletonBox style={{ width: '50%', height: 14, borderRadius: 4, marginTop: spacing.sm }} />
        <SkeletonBox style={{ width: '30%', height: 14, borderRadius: 4, marginTop: spacing.sm }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
}

export function SkeletonChips() {
  return (
    <View style={skStyles.chipsRow}>
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBox
          key={i}
          style={{
            width: 80,
            height: 36,
            borderRadius: radius.chip,
            marginRight: spacing.sm,
          }}
        />
      ))}
    </View>
  );
}

const skStyles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  listItemContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
});
