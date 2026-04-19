import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { useAssistantStore } from '../stores/assistant.store';
import { useAuthStore } from '../stores/auth.store';
import { sizes } from '../theme/spacing';

export function AssistantButton() {
  const insets = useSafeAreaInsets();
  const { open, isOpen } = useAssistantStore();
  const user = useAuthStore((s) => s.user);

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    open();
  };

  // Only show when user is logged in and sheet is not already open
  if (!user || isOpen) return null;

  const bottomOffset = insets.bottom + sizes.tabBarHeight + 12;

  return (
    <Animated.View style={[styles.container, { bottom: bottomOffset }, animatedStyle]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={styles.button}
      >
        <Ionicons name="sparkles" size={24} color={colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  button: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
