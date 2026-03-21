import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonChips, SkeletonList } from '../../../components/ui/Skeleton';
import { spacing } from '../../../theme/spacing';

export function ExploreSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonChips />
      <SkeletonList count={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.screenPadding,
  },
});
