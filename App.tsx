import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useThemeStore } from './src/stores/theme.store';
import { useLanguageStore } from './src/stores/language.store';

export default function App() {
  const isDark = useThemeStore((s) => s.isDark);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const loadLocale = useLanguageStore((s) => s.loadLocale);

  useEffect(() => {
    loadTheme();
    loadLocale();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={isDark ? 'light' : 'auto'} />
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
