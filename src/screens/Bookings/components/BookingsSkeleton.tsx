import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonList } from '../../../components/ui/Skeleton';
import { spacing } from '../../../theme/spacing';

export function BookingsSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonList count={5} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.screenPadding,
  },
});
