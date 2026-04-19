import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';

const TEASER_ITEMS = [
  { icon: 'football-outline', label: 'Gear' },
  { icon: 'shirt-outline', label: 'Apparel' },
  { icon: 'barbell-outline', label: 'Equipment' },
];

export function ShopScreen() {
  const insets = useSafeAreaInsets();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  const pulse = useSharedValue(0);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 1800 }), withTiming(0, { duration: 1800 })),
      -1,
    );
    ringScale.value = withRepeat(
      withSequence(withTiming(1.18, { duration: 2000 }), withTiming(1.0, { duration: 2000 })),
      -1,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.25, 0.55]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.1]) }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [1, 1.18], [0.5, 0.15]),
  }));

  const accentColor = isDark ? '#A2B8FF' : '#0B1A3E';
  const cardBg = isDark ? '#0C1832' : '#FFFFFF';

  const handleNotifyMe = () => {
    Alert.alert('You\'re on the list!', 'We\'ll notify you when the Shop launches.', [{ text: 'Awesome!' }]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />

      {/* Header */}
      <Text style={[styles.header, { color: tc.textPrimary }]}>Shop</Text>

      <View style={styles.content}>
        {/* Animated icon */}
        <View style={styles.iconWrap}>
          {/* Outer pulsing ring */}
          <Animated.View style={[styles.outerRing, { borderColor: accentColor }, ringStyle]} />
          {/* Inner glow */}
          <Animated.View style={[styles.glow, { backgroundColor: isDark ? 'rgba(162,184,255,0.18)' : 'rgba(11,26,62,0.08)' }, glowStyle]} />
          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(162,184,255,0.15)' : 'rgba(11,26,62,0.07)' }]}>
            <Ionicons name="bag-handle" size={52} color={accentColor} />
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: tc.textPrimary }]}>Coming Soon</Text>
        <Text style={[styles.subtitle, { color: tc.textSecondary }]}>
          Something exciting is on its way.{'\n'}The Sportify Shop is launching soon.
        </Text>

        {/* Teaser pills */}
        <View style={styles.pillsRow}>
          {TEASER_ITEMS.map((item) => (
            <View key={item.label} style={[styles.teaserPill, { backgroundColor: cardBg }]}>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={9} color={tc.textHint} />
              </View>
              <Ionicons name={item.icon as any} size={20} color={tc.textHint} />
              <Text style={[styles.pillLabel, { color: tc.textHint }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.notifyBtn, { backgroundColor: isDark ? '#1D4ED8' : '#0B1A3E' }]}
          onPress={handleNotifyMe}
          activeOpacity={0.8}
        >
          <Ionicons name="notifications-outline" size={18} color="#fff" />
          <Text style={styles.notifyText}>Notify Me</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    fontSize: 24, fontWeight: '800',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 160, height: 160, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  outerRing: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    borderWidth: 1.5,
  },
  glow: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
  },
  iconCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  pillsRow: { flexDirection: 'row', gap: 12, marginBottom: 36 },
  teaserPill: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16,
    gap: 6, position: 'relative',
    opacity: 0.6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
    elevation: 2,
  },
  lockBadge: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  pillLabel: { fontSize: 12, fontWeight: '600' },
  notifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32,
  },
  notifyText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
