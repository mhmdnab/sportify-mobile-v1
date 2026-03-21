import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
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
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'App' }] });
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isHydrated, isAuthenticated, isOnboarded]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Ionicons name="football" size={64} color={colors.white} />
      <Text style={styles.title}>Sportify</Text>
      <Text style={styles.subtitle}>Book. Play. Repeat.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    fontWeight: '500',
  },
});
