import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCard, SkeletonLine, SkeletonChips, SkeletonList } from '../../../components/ui/Skeleton';
import { spacing } from '../../../theme/spacing';

export function BranchDetailSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonCard />
      <View style={styles.content}>
        <SkeletonLine width="60%" height={24} />
        <SkeletonLine width="40%" height={16} />
        <SkeletonChips />
        <SkeletonList count={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.screenPadding,
  },
});
