import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/auth.store';
import { RootStackParamList } from '../../types/navigation';

const { width, height } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const markOnboarded = useAuthStore((s) => s.markOnboarded);

  const handleGetStarted = async () => {
    await markOnboarded();
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[colors.navyDark, colors.navy, colors.navyLight]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            contentFit="contain"
          />
        </View>

        {/* Welcome Text */}
        <View style={styles.textContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.brandName}>SPORTIFY</Text>
          <Text style={styles.description}>
            Experience sports like never before by Discover the perfect coach to unlock your full
            potential and Reserving top-notch stadiums and facilities for your next game
          </Text>
        </View>

        {/* Decorative curve */}
        <View style={styles.curveContainer}>
          <View style={styles.curve} />
        </View>

        {/* Get Started Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: height * 0.1,
    paddingBottom: height * 0.06,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoImage: {
    width: 200,
    height: 100,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 4,
    marginBottom: 20,
  },
  description: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  curveContainer: {
    width: width,
    height: 60,
    overflow: 'hidden',
    position: 'relative',
  },
  curve: {
    width: width * 2,
    height: width * 2,
    borderRadius: width,
    backgroundColor: 'rgba(255,255,255,0.05)',
    position: 'absolute',
    bottom: -width * 2 + 60,
    left: -width / 2,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 60,
  },
  getStartedButton: {
    backgroundColor: colors.navyDark,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  getStartedText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
