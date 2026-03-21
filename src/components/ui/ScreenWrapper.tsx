import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  padding?: boolean;
  backgroundColor?: string;
  safeArea?: boolean;
}

export function ScreenWrapper({
  children,
  scroll = false,
  style,
  padding = true,
  backgroundColor = colors.background,
  safeArea = true,
}: ScreenWrapperProps) {
  const Wrapper = safeArea ? SafeAreaView : View;
  const containerStyle = [
    styles.container,
    { backgroundColor },
    padding && styles.padding,
    style,
  ];

  return (
    <Wrapper style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="dark-content" />
      {scroll ? (
        <ScrollView
          style={containerStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={containerStyle}>{children}</View>
      )}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: spacing.screenPadding,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
