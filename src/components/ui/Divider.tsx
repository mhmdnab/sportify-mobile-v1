import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface DividerProps {
  text?: string;
  style?: ViewStyle;
}

export function Divider({ text, style }: DividerProps) {
  if (text) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.line} />
        <Text style={styles.text}>{text}</Text>
        <View style={styles.line} />
      </View>
    );
  }

  return <View style={[styles.simpleLine, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  text: {
    marginHorizontal: spacing.lg,
    fontSize: 14,
    color: colors.textHint,
  },
  simpleLine: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
});
