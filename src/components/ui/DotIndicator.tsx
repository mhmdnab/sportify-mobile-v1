import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface DotIndicatorProps {
  count: number;
  activeIndex: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function DotIndicator({
  count,
  activeIndex,
  activeColor = colors.primary,
  inactiveColor = colors.border,
}: DotIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === activeIndex ? activeColor : inactiveColor,
              width: i === activeIndex ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
});
