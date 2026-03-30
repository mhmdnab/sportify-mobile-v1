import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              styles.dot,
              i <= currentStep ? styles.activeDot : styles.inactiveDot,
            ]}
          />
          {i < totalSteps - 1 && (
            <View
              style={[
                styles.line,
                i < currentStep ? styles.activeLine : styles.inactiveLine,
              ]}
            />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeDot: {
    backgroundColor: colors.white,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  line: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  activeLine: {
    backgroundColor: colors.white,
  },
  inactiveLine: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
