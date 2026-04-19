import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/auth.store';
import { isValidEmail } from '../../utils/validation';
import { AuthStackParamList } from '../../types/navigation';
import { spacing } from '../../theme/spacing';

type AuthNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export function LoginScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthNav>();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 3000 }), withTiming(1.0, { duration: 3000 })),
      -1,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 0.08 }));

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = t('auth.emailRequired');
    else if (!isValidEmail(email)) newErrors.email = t('auth.invalidEmail');
    if (!password) newErrors.password = t('auth.passwordRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login({ email, password });
      const currentUser = useAuthStore.getState().user;
      const target = currentUser?.owner ? 'OwnerApp' : currentUser?.manager ? 'ManagerApp' : currentUser?.coach ? 'CoachApp' : 'App';
      (navigation as any).reset({ index: 0, routes: [{ name: target }] });
    } catch (error: any) {
      Alert.alert(
        t('auth.loginFailed'),
        error?.response?.data?.message || t('auth.invalidCredentials'),
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen gradient */}
      <LinearGradient
        colors={['#060F28', '#0C1A3E', '#0F2048']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative blobs */}
      <Animated.View style={[styles.blob1, pulseStyle]} />
      <Animated.View style={[styles.blob2, pulseStyle]} />
      <View style={styles.blob3} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.logoWrap}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </Animated.View>

          {/* Heading */}
          <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.headingWrap}>
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.heading}>Sign in to continue</Text>
          </Animated.View>

          {/* Form card */}
          <Animated.View entering={FadeInUp.delay(140).springify()} style={styles.card}>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email</Text>
              <View style={[
                styles.inputRow,
                focusedField === 'email' && styles.inputRowFocused,
                errors.email && styles.inputRowError,
              ]}>
                <Ionicons name="mail-outline" size={18} color={focusedField === 'email' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={{ marginRight: 10 }} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
              {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Password</Text>
              <View style={[
                styles.inputRow,
                focusedField === 'password' && styles.inputRowFocused,
                errors.password && styles.inputRowError,
              ]}>
                <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color="rgba(255,255,255,0.4)"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
            </View>

            {/* Forgot password */}
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#1D4ED8', '#1E40AF']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.loginBtnGradient}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.loginBtnText}>{t('auth.login')}</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            {/* Sign up */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>{t('auth.noAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupLink}>{t('auth.signup')}</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
              <Ionicons name="logo-google" size={18} color="#fff" />
              <Text style={styles.googleBtnText}>{t('auth.loginWithGoogle')}</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060F28' },

  blob1: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#1D4ED8',
    top: -80,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#A2B8FF',
    bottom: 120,
    left: -60,
  },
  blob3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(162,184,255,0.07)',
    top: '38%',
    right: 30,
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  logoWrap: {
    alignItems: 'center',
    paddingTop: 90,
    paddingBottom: 16,
  },
  logo: {
    width: 120,
    height: 60,
  },

  headingWrap: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: spacing.screenPadding,
  },
  welcome: {
    fontSize: 14,
    color: 'rgba(162,184,255,0.7)',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },

  card: {
    marginHorizontal: spacing.screenPadding,
    backgroundColor: 'rgba(12,24,50,0.7)',
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(162,184,255,0.1)',
  },

  fieldWrap: { marginBottom: 18 },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(162,184,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputRowFocused: {
    borderColor: '#A2B8FF',
    backgroundColor: 'rgba(162,184,255,0.08)',
  },
  inputRowError: {
    borderColor: '#FF6B6B',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  error: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 5,
    marginLeft: 4,
  },

  forgotWrap: { alignSelf: 'flex-end', marginBottom: 22, marginTop: -4 },
  forgotText: { fontSize: 13, color: 'rgba(162,184,255,0.7)', fontWeight: '500' },

  loginBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 18 },
  loginBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  signupRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  signupText: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  signupLink: { fontSize: 13, color: '#A2B8FF', fontWeight: '700' },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { marginHorizontal: 14, fontSize: 13, color: 'rgba(255,255,255,0.3)' },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 10,
  },
  googleBtnText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
