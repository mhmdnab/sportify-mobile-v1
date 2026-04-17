import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/auth.store';
import { RootStackParamList } from '../../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isOnboarded = useAuthStore((s) => s.isOnboarded);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const timer = setTimeout(() => {
      if (!isOnboarded) {
        navigation.reset({ index: 0, routes: [{ name: 'Onboarding' }] });
      } else if (!isAuthenticated) {
        navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
      } else if (user?.owner) {
        navigation.reset({ index: 0, routes: [{ name: 'OwnerApp' }] });
      } else if (user?.manager) {
        navigation.reset({ index: 0, routes: [{ name: 'ManagerApp' }] });
      } else if (user?.coach) {
        navigation.reset({ index: 0, routes: [{ name: 'CoachApp' }] });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'App' }] });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isHydrated, isAuthenticated, isOnboarded, user]);

  return (
    <LinearGradient
      colors={[colors.navyDark, colors.navy, colors.navyLight]}
      style={styles.container}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <Ionicons name="fitness" size={64} color={colors.white} />
      <Text style={styles.title}>SPORTIFY</Text>
      <Text style={styles.subtitle}>Book. Play. Repeat.</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.white,
    marginTop: 16,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    fontWeight: '500',
  },
});
