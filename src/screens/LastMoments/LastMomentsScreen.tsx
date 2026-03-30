import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';

export function LastMomentsScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <Text style={[styles.header, { color: tc.textPrimary }]}>Last Moments</Text>
      <View style={styles.content}>
        <Text style={[styles.placeholder, { color: tc.textHint }]}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: '800',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    fontSize: 15,
  },
});
