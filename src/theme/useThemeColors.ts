import { useThemeStore } from '../stores/theme.store';
import { lightColors, darkColors, ThemeColors } from './colors';

export function useThemeColors(): ThemeColors {
  const isDark = useThemeStore((s) => s.isDark);
  return isDark ? darkColors : lightColors;
}
