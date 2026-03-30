import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/colors';
import { useThemeColors } from '../theme/useThemeColors';
import { useThemeStore } from '../stores/theme.store';
import { TabConfig, tabs as defaultTabs } from '../constants/tabs';
import { useUIStore } from '../stores/ui.store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_MARGIN = 16;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_MARGIN * 2;
const INDICATOR_PADDING = 4;

const SPRING_CONFIG = {
  damping: 18,
  stiffness: 200,
  mass: 0.8,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

interface CustomTabBarProps extends BottomTabBarProps {
  tabConfig?: TabConfig[];
}

export function CustomTabBar({ state, descriptors, navigation, tabConfig }: CustomTabBarProps) {
  const tabs = tabConfig || defaultTabs;
  const TAB_COUNT = tabs.length;
  const TAB_WIDTH = (TAB_BAR_WIDTH - 16) / TAB_COUNT;
  const INDICATOR_WIDTH = TAB_WIDTH - INDICATOR_PADDING * 2;
  const insets = useSafeAreaInsets();
  const indicatorX = useSharedValue(0);
  const activeScale = useSharedValue(1);
  const isDrawerOpen = useUIStore((s) => s.isDrawerOpen);
  const isDark = useThemeStore((s) => s.isDark);
  const tc = useThemeColors();

  // Tab bar visibility animation
  const tabBarTranslateY = useSharedValue(0);
  const tabBarOpacity = useSharedValue(1);
  const tabBarScale = useSharedValue(1);

  useEffect(() => {
    if (isDrawerOpen) {
      tabBarTranslateY.value = withSpring(120, { damping: 20, stiffness: 180 });
      tabBarOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
      tabBarScale.value = withSpring(0.85, { damping: 20, stiffness: 200 });
    } else {
      tabBarTranslateY.value = withSpring(0, { damping: 16, stiffness: 140, mass: 0.9 });
      tabBarOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) });
      tabBarScale.value = withSpring(1, { damping: 14, stiffness: 160 });
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    const targetX = state.index * TAB_WIDTH + 8 + INDICATOR_PADDING;
    indicatorX.value = withSpring(targetX, SPRING_CONFIG);
    activeScale.value = withSpring(0.92, { damping: 12, stiffness: 400 }, () => {
      activeScale.value = withSpring(1, { damping: 14, stiffness: 300 });
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const indicatorScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activeScale.value }],
  }));

  const tabBarAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: tabBarTranslateY.value },
      { scale: tabBarScale.value },
    ],
    opacity: tabBarOpacity.value,
  }));

  const iconColor = isDark ? '#C8D0E8' : colors.navy;

  return (
    <Animated.View style={[styles.outerContainer, { paddingBottom: insets.bottom || 12 }, tabBarAnimStyle]}>
      <View style={[
        styles.tabBarWrapper,
        { borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(200,200,200,0.4)' },
      ]}>
        {/* Glass background */}
        <BlurView
          intensity={isDark ? 40 : 60}
          tint={isDark ? 'dark' : 'systemChromeMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[
          styles.glassOverlay,
          { backgroundColor: isDark ? 'rgba(6,15,40,0.75)' : 'rgba(255,255,255,0.15)' },
        ]} />
        <View style={[
          styles.topShine,
          { backgroundColor: isDark ? 'rgba(150,170,220,0.08)' : 'rgba(255,255,255,0.3)' },
        ]} />

        {/* Sliding indicator */}
        <Animated.View style={[styles.indicatorContainer, { width: INDICATOR_WIDTH }, indicatorStyle]}>
          <Animated.View style={[styles.indicator, indicatorScaleStyle]}>
            <View style={[
              styles.indicatorInner,
              { backgroundColor: isDark ? 'rgba(150,170,220,0.12)' : 'rgba(0,0,0,0.08)' },
            ]} />
          </Animated.View>
        </Animated.View>

        {/* Tab items */}
        <View style={styles.tabsRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const tab = tabs[index];
            if (!tab) return null;

            return (
              <TabItem
                key={route.key}
                tab={tab}
                isFocused={isFocused}
                iconColor={iconColor}
                tabWidth={TAB_WIDTH}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
              />
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

function TabItem({
  tab,
  isFocused,
  onPress,
  iconColor,
  tabWidth,
}: {
  tab: TabConfig;
  isFocused: boolean;
  onPress: () => void;
  iconColor: string;
  tabWidth: number;
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const iconOpacity = useSharedValue(isFocused ? 1 : 0.5);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0.5);
  const iconTranslateY = useSharedValue(isFocused ? -2 : 0);

  useEffect(() => {
    iconOpacity.value = withTiming(isFocused ? 1 : 0.5, { duration: 250 });
    labelOpacity.value = withTiming(isFocused ? 1 : 0.5, { duration: 250 });
    iconTranslateY.value = withSpring(isFocused ? -2 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [isFocused]);

  const iconAnimStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [
      { translateY: iconTranslateY.value },
      { scale: scale.value },
    ],
  }));

  const labelAnimStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 12, stiffness: 300 });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[styles.tab, { width: tabWidth }]}
    >
      <Animated.View style={iconAnimStyle}>
        <Ionicons
          name={isFocused ? tab.activeIcon : tab.icon}
          size={22}
          color={iconColor}
        />
      </Animated.View>
      <Animated.Text style={[styles.label, { color: iconColor }, labelAnimStyle]}>
        {t(tab.labelKey)}
      </Animated.Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: TAB_BAR_MARGIN,
    paddingTop: 8,
  },
  tabBarWrapper: {
    width: TAB_BAR_WIDTH,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 0.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  indicatorContainer: {
    position: 'absolute',
    top: 6,
    left: 0,
    height: 56,
    zIndex: 0,
  },
  indicator: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  indicatorInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    zIndex: 1,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});
