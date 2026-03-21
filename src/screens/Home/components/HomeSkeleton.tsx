import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonChips, SkeletonCard, SkeletonList } from '../../../components/ui/Skeleton';
import { spacing } from '../../../theme/spacing';

export function HomeSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonChips />
      <SkeletonCard />
      <SkeletonList count={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.screenPadding,
  },
});
