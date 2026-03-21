import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
  color?: string;
}

export function H1({ children, color, style, ...props }: TypographyProps) {
  return (
    <Text style={[styles.h1, color ? { color } : null, style]} {...props}>
      {children}
    </Text>
  );
}

export function H2({ children, color, style, ...props }: TypographyProps) {
  return (
    <Text style={[styles.h2, color ? { color } : null, style]} {...props}>
      {children}
    </Text>
  );
}

export function H3({ children, color, style, ...props }: TypographyProps) {
  return (
    <Text style={[styles.h3, color ? { color } : null, style]} {...props}>
      {children}
    </Text>
  );
}

export function Body({ children, color, style, ...props }: TypographyProps) {
  return (
    <Text style={[styles.body, color ? { color } : null, style]} {...props}>
      {children}
    </Text>
  );
}

export function Caption({ children, color, style, ...props }: TypographyProps) {
  return (
    <Text style={[styles.caption, color ? { color } : null, style]} {...props}>
      {children}
    </Text>
  );
}

export function Label({ children, color, style, ...props }: TypographyProps) {
  return (
    <Text style={[styles.label, color ? { color } : null, style]} {...props}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  h2: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  h3: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
  },
});
