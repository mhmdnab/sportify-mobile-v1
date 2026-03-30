import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  isDark: boolean;
  toggleDarkMode: () => void;
  loadTheme: () => Promise<void>;
}

const THEME_KEY = '@sportify_dark_mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,
  toggleDarkMode: () => {
    const next = !get().isDark;
    set({ isDark: next });
    AsyncStorage.setItem(THEME_KEY, JSON.stringify(next));
  },
  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      if (stored !== null) {
        set({ isDark: JSON.parse(stored) });
      }
    } catch {}
  },
}));
