import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { useThemeStore } from '../../stores/theme.store';
import { radius, sizes } from '../../theme/spacing';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isDark = useThemeStore((s) => s.isDark);

  const btnBg = isDark ? colors.navyLight : colors.navy;
  const accentColor = isDark ? '#A0B4E0' : colors.navy;

  const dynamicVariantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: { backgroundColor: btnBg },
    secondary: { backgroundColor: isDark ? colors.navyMid : colors.surface },
    outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: accentColor },
    ghost: { backgroundColor: 'transparent' },
  };

  const dynamicTextStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: colors.white },
    secondary: { color: isDark ? '#EEF0F6' : colors.textPrimary },
    outline: { color: accentColor },
    ghost: { color: accentColor },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.base,
        dynamicVariantStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : accentColor}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            dynamicTextStyles[variant],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: sizes.buttonHeight,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
});
