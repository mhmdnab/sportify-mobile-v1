import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
}

export function StepIndicator({ totalSteps, currentStep }: StepIndicatorProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <React.Fragment key={i}>
          <View style={styles.stepCol}>
            <View style={[
              styles.circle,
              i < currentStep && styles.circleCompleted,
              i === currentStep && styles.circleActive,
            ]}>
              {i < currentStep
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={[styles.num, i === currentStep && styles.numActive]}>{i + 1}</Text>
              }
            </View>
          </View>
          {i < totalSteps - 1 && (
            <View style={[styles.line, i < currentStep && styles.lineCompleted]} />
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
    paddingVertical: 12,
  },
  stepCol: { alignItems: 'center' },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  circleActive: {
    backgroundColor: '#1D4ED8',
    borderColor: '#A2B8FF',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  circleCompleted: {
    backgroundColor: '#00C16A',
    borderColor: '#00C16A',
  },
  num: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.3)',
  },
  numActive: {
    color: '#fff',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 6,
    minWidth: 28,
    borderRadius: 1,
  },
  lineCompleted: {
    backgroundColor: '#00C16A',
  },
});
