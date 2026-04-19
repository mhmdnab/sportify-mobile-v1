import React, { useState, useMemo, useEffect } from 'react';
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
  Modal,
  FlatList,
  ActivityIndicator,
  Dimensions,
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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAuthStore } from '../../stores/auth.store';
import { isValidEmail, isStrongPassword, isValidName } from '../../utils/validation';
import { AuthStackParamList } from '../../types/navigation';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useTranslation } from 'react-i18next';
import { countries, Country } from '../../constants/countries';
import { spacing } from '../../theme/spacing';

const { height } = Dimensions.get('window');
const TOTAL_STEPS = 4;

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type PickerModalType = 'country' | 'city' | 'phoneCountry' | null;

const STEP_META = [
  { title: 'Who are you?', subtitle: "Let's start with your identity" },
  { title: 'Your details', subtitle: 'Fill in your basic information' },
  { title: 'Where are you?', subtitle: 'Set your location' },
  { title: 'Secure your account', subtitle: 'Create a strong password' },
];

function calcPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const map = [
    { score: 0, label: '', color: 'transparent' },
    { score: 1, label: 'Weak', color: '#FF4444' },
    { score: 2, label: 'Fair', color: '#FF9500' },
    { score: 3, label: 'Good', color: '#00C16A' },
    { score: 4, label: 'Strong', color: '#A2B8FF' },
  ];
  return map[s];
}

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<Country>(countries[0]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerModal, setPickerModal] = useState<PickerModalType>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const cityOptions = useMemo(() => selectedCountry?.cities ?? [], [selectedCountry]);
  const strength = calcPasswordStrength(password);

  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.12, { duration: 3000 }), withTiming(1.0, { duration: 3000 })),
      -1,
    );
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 0.08 }));

  const validateStep = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 0) {
      if (!gender) newErrors.gender = t('auth.selectGender');
    } else if (step === 1) {
      const nameError = isValidName(name);
      if (nameError) newErrors.name = nameError;
      if (!email) newErrors.email = t('auth.emailRequired');
      else if (!isValidEmail(email)) newErrors.email = t('auth.invalidEmail');
    } else if (step === 2) {
      if (!selectedCountry) newErrors.country = t('auth.countryRequired');
      if (!selectedCity) newErrors.city = t('auth.cityRequired');
    } else if (step === 3) {
      if (!password) newErrors.password = t('auth.passwordRequired');
      else {
        const passwordError = isStrongPassword(password);
        if (passwordError) newErrors.password = passwordError;
      }
      if (!confirmPassword) newErrors.confirmPassword = t('auth.confirmPasswordRequired');
      else if (password !== confirmPassword) newErrors.confirmPassword = t('auth.passwordsNoMatch');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      setErrors({});
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    } else {
      navigation.goBack();
    }
  };

  const handleRegister = async () => {
    if (!validateStep()) return;
    try {
      await register({
        name,
        email,
        password,
        phone: phone || undefined,
        phoneCountryCode: selectedPhoneCountry.phoneCode,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
        address: selectedCountry
          ? { country: selectedCountry.name, city: selectedCity }
          : undefined,
      });
      navigation.navigate('VerifyEmail', { email });
    } catch (error: any) {
      Alert.alert(
        t('auth.registrationFailed'),
        error?.response?.data?.message || t('auth.registrationError'),
      );
    }
  };

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDateOfBirth(selectedDate);
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const renderPickerModal = () => {
    let title = '';
    let data: { label: string; value: string; extra?: any }[] = [];
    if (pickerModal === 'country') {
      title = t('auth.selectCountry');
      data = countries.map((c) => ({ label: `${c.flag}  ${c.name}`, value: c.code, extra: c }));
    } else if (pickerModal === 'city') {
      title = t('auth.selectCity');
      data = cityOptions.map((c) => ({ label: c, value: c }));
    } else if (pickerModal === 'phoneCountry') {
      title = t('auth.selectCountryCode');
      data = countries.map((c) => ({ label: `${c.flag}  ${c.name} (${c.phoneCode})`, value: c.code, extra: c }));
    }
    return (
      <Modal visible={pickerModal !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setPickerModal(null)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected =
                  (pickerModal === 'country' && selectedCountry?.code === item.value) ||
                  (pickerModal === 'city' && selectedCity === item.value) ||
                  (pickerModal === 'phoneCountry' && selectedPhoneCountry.code === item.value);
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      if (pickerModal === 'country') {
                        setSelectedCountry(item.extra);
                        setSelectedCity('');
                      } else if (pickerModal === 'city') {
                        setSelectedCity(item.value);
                      } else if (pickerModal === 'phoneCountry') {
                        setSelectedPhoneCountry(item.extra);
                      }
                      setPickerModal(null);
                    }}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>{item.label}</Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#A2B8FF" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderGenderStep = () => (
    <View style={styles.genderWrap}>
      <View style={styles.genderRow}>
        {(['FEMALE', 'MALE'] as const).map((g) => {
          const selected = gender === g;
          return (
            <TouchableOpacity
              key={g}
              style={[styles.genderCard, selected && styles.genderCardSelected]}
              onPress={() => setGender(g)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={selected
                  ? ['rgba(29,78,216,0.45)', 'rgba(29,78,216,0.18)']
                  : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)']}
                style={styles.genderGradient}
              >
                <View style={[styles.genderIconWrap, selected && styles.genderIconWrapSelected]}>
                  <Ionicons
                    name={g === 'FEMALE' ? 'woman' : 'man'}
                    size={44}
                    color={selected ? '#A2B8FF' : 'rgba(255,255,255,0.35)'}
                  />
                </View>
                <Text style={[styles.genderLabel, selected && styles.genderLabelSelected]}>
                  {g === 'FEMALE' ? t('auth.female') : t('auth.male')}
                </Text>
                {selected && (
                  <View style={styles.genderCheck}>
                    <Ionicons name="checkmark-circle" size={22} color="#A2B8FF" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
      {errors.gender ? <Text style={styles.error}>{errors.gender}</Text> : null}
    </View>
  );

  const renderInfoStep = () => (
    <View style={styles.fields}>
      {/* Name */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Full Name</Text>
        <View style={[styles.inputRow, focusedField === 'name' && styles.inputRowFocused, errors.name && styles.inputRowError]}>
          <Ionicons name="person-outline" size={17} color={focusedField === 'name' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: undefined })); }}
            placeholder={t('auth.username')}
            placeholderTextColor="rgba(255,255,255,0.25)"
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        {errors.name ? <Text style={styles.error}>{errors.name}</Text> : null}
      </View>

      {/* Email */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Email</Text>
        <View style={[styles.inputRow, focusedField === 'email' && styles.inputRowFocused, errors.email && styles.inputRowError]}>
          <Ionicons name="mail-outline" size={17} color={focusedField === 'email' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(v) => { setEmail(v); setErrors((e) => ({ ...e, email: undefined })); }}
            placeholder="your@email.com"
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocusedField('email')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
      </View>

      {/* Date of Birth */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <TouchableOpacity
          style={[styles.inputRow, focusedField === 'dob' && styles.inputRowFocused]}
          onPress={() => { setShowDatePicker(true); setFocusedField('dob'); }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={17} color={focusedField === 'dob' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
          <Text style={[styles.input, !dateOfBirth && { color: 'rgba(255,255,255,0.25)' }]}>
            {dateOfBirth ? formatDate(dateOfBirth) : t('auth.dateOfBirth')}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <View style={styles.datePicker}>
            <DateTimePicker
              value={dateOfBirth || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              minimumDate={new Date(1950, 0, 1)}
              themeVariant="dark"
            />
            {Platform.OS === 'ios' && (
              <TouchableOpacity style={styles.datePickerDone} onPress={() => { setShowDatePicker(false); setFocusedField(null); }}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Phone */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Phone <Text style={styles.optional}>(optional)</Text></Text>
        <View style={[styles.inputRow, focusedField === 'phone' && styles.inputRowFocused]}>
          <Ionicons name="call-outline" size={17} color={focusedField === 'phone' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
          <TouchableOpacity style={styles.phonePrefix} onPress={() => setPickerModal('phoneCountry')}>
            <Text style={styles.phonePrefixText}>{selectedPhoneCountry.flag} {selectedPhoneCountry.phoneCode}</Text>
            <Ionicons name="chevron-down" size={12} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
          <View style={styles.phoneDivider} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('auth.phoneNumber')}
            placeholderTextColor="rgba(255,255,255,0.25)"
            keyboardType="phone-pad"
            onFocus={() => setFocusedField('phone')}
            onBlur={() => setFocusedField(null)}
          />
        </View>
      </View>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.fields}>
      {/* Country */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Country</Text>
        <TouchableOpacity
          style={[styles.inputRow, errors.country && styles.inputRowError]}
          onPress={() => setPickerModal('country')}
          activeOpacity={0.7}
        >
          <Ionicons name="globe-outline" size={17} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
          <Text style={[styles.input, !selectedCountry && { color: 'rgba(255,255,255,0.25)' }]}>
            {selectedCountry ? `${selectedCountry.flag}  ${selectedCountry.name}` : t('auth.country')}
          </Text>
          <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
        {errors.country ? <Text style={styles.error}>{errors.country}</Text> : null}
      </View>

      {/* City */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>City</Text>
        <TouchableOpacity
          style={[styles.inputRow, !selectedCountry && styles.inputRowDisabled, errors.city && styles.inputRowError]}
          onPress={() => selectedCountry && setPickerModal('city')}
          activeOpacity={selectedCountry ? 0.7 : 1}
        >
          <Ionicons name="location-outline" size={17} color="rgba(255,255,255,0.35)" style={styles.inputIcon} />
          <Text style={[styles.input, !selectedCity && { color: 'rgba(255,255,255,0.25)' }]}>
            {selectedCity || t('auth.city')}
          </Text>
          <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
        {errors.city ? <Text style={styles.error}>{errors.city}</Text> : null}
      </View>

      {/* Location hint */}
      <View style={styles.locationHint}>
        <Ionicons name="information-circle-outline" size={14} color="rgba(162,184,255,0.5)" />
        <Text style={styles.locationHintText}>Used to find venues near you</Text>
      </View>
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.fields}>
      {/* Password */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Password</Text>
        <View style={[styles.inputRow, focusedField === 'password' && styles.inputRowFocused, errors.password && styles.inputRowError]}>
          <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'password' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={password}
            onChangeText={(v) => { setPassword(v); setErrors((e) => ({ ...e, password: undefined })); }}
            placeholder={t('auth.password')}
            placeholderTextColor="rgba(255,255,255,0.25)"
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={17} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
        {password.length > 0 && (
          <View style={styles.strengthWrap}>
            <View style={styles.strengthBarBg}>
              <View style={[styles.strengthBarFill, { width: `${(strength.score / 4) * 100}%` as any, backgroundColor: strength.color }]} />
            </View>
            {strength.label ? <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text> : null}
          </View>
        )}
      </View>

      {/* Confirm Password */}
      <View style={styles.fieldWrap}>
        <Text style={styles.fieldLabel}>Confirm Password</Text>
        <View style={[styles.inputRow, focusedField === 'confirmPassword' && styles.inputRowFocused, errors.confirmPassword && styles.inputRowError]}>
          <Ionicons name="shield-checkmark-outline" size={17} color={focusedField === 'confirmPassword' ? '#A2B8FF' : 'rgba(255,255,255,0.35)'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setErrors((e) => ({ ...e, confirmPassword: undefined })); }}
            placeholder={t('auth.confirmPassword')}
            placeholderTextColor="rgba(255,255,255,0.25)"
            secureTextEntry={!showConfirmPassword}
            onFocus={() => setFocusedField('confirmPassword')}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={17} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        </View>
        {errors.confirmPassword ? <Text style={styles.error}>{errors.confirmPassword}</Text> : null}
      </View>

      {/* Terms hint */}
      <View style={styles.termsWrap}>
        <Ionicons name="lock-open-outline" size={13} color="rgba(162,184,255,0.5)" />
        <Text style={styles.termsText}>By creating an account you agree to our Terms & Privacy Policy</Text>
      </View>
    </View>
  );

  const renderStepContent = () => {
    switch (step) {
      case 0: return renderGenderStep();
      case 1: return renderInfoStep();
      case 2: return renderLocationStep();
      case 3: return renderPasswordStep();
      default: return null;
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Background gradient */}
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
          {/* Top bar */}
          <Animated.View entering={FadeInDown.delay(0).springify()} style={styles.topBar}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
            <Image source={require('../../../assets/logo.png')} style={styles.logo} contentFit="contain" />
            <View style={{ width: 34 }} />
          </Animated.View>

          {/* Step indicator */}
          <Animated.View entering={FadeInDown.delay(60).springify()}>
            <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />
          </Animated.View>

          {/* Step heading */}
          <Animated.View key={`heading-${step}`} entering={FadeInDown.delay(80).springify()} style={styles.headingWrap}>
            <Text style={styles.stepCounter}>Step {step + 1} of {TOTAL_STEPS}</Text>
            <Text style={styles.stepTitle}>{STEP_META[step].title}</Text>
            <Text style={styles.stepSubtitle}>{STEP_META[step].subtitle}</Text>
          </Animated.View>

          {/* Content card */}
          <Animated.View key={`card-${step}`} entering={FadeInUp.delay(120).springify()} style={styles.card}>
            {renderStepContent()}
          </Animated.View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.nextBtn, isLoading && { opacity: 0.7 }]}
            onPress={handleNext}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#1D4ED8', '#1E40AF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGradient}
            >
              {isLoading
                ? <ActivityIndicator color="#fff" />
                : (
                  <View style={styles.nextBtnInner}>
                    <Text style={styles.nextBtnText}>
                      {step === TOTAL_STEPS - 1 ? 'Create Account' : 'Continue'}
                    </Text>
                    <Ionicons name={step === TOTAL_STEPS - 1 ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
                  </View>
                )
              }
            </LinearGradient>
          </TouchableOpacity>

          {step === 0 && (
            <View style={styles.loginRow}>
              <Text style={styles.loginHint}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.loginLink}>Sign in</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {renderPickerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#060F28' },

  blob1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#1D4ED8',
    top: -60,
    left: -80,
  },
  blob2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#A2B8FF',
    bottom: 100,
    right: -50,
  },
  blob3: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(162,184,255,0.07)',
    top: '45%',
    left: 20,
  },

  scroll: { flexGrow: 1, paddingBottom: 20 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 4,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  logo: { width: 90, height: 45 },

  headingWrap: {
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: 20,
  },
  stepCounter: {
    fontSize: 11,
    color: 'rgba(162,184,255,0.5)',
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 13,
    color: 'rgba(162,184,255,0.6)',
    textAlign: 'center',
  },

  card: {
    marginHorizontal: spacing.screenPadding,
    backgroundColor: 'rgba(12,24,50,0.7)',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(162,184,255,0.1)',
  },

  // Gender step
  genderWrap: { gap: 12 },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: {
    flex: 1,
    height: height * 0.22,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  genderCardSelected: {
    borderColor: '#A2B8FF',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  genderGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 16,
  },
  genderIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  genderIconWrapSelected: {
    backgroundColor: 'rgba(162,184,255,0.15)',
    borderColor: 'rgba(162,184,255,0.3)',
  },
  genderLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.3,
  },
  genderLabelSelected: {
    color: '#A2B8FF',
  },
  genderCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Form fields
  fields: { gap: 0 },
  fieldWrap: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(162,184,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  optional: {
    fontWeight: '400',
    color: 'rgba(162,184,255,0.4)',
    textTransform: 'none',
    letterSpacing: 0,
    fontSize: 11,
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
  inputRowDisabled: {
    opacity: 0.45,
  },
  inputIcon: { marginRight: 10 },
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

  // Phone
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 8,
  },
  phonePrefixText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  phoneDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginRight: 10,
  },

  // Date picker
  datePicker: { marginTop: 4 },
  datePickerDone: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  datePickerDoneText: { color: '#A2B8FF', fontWeight: '700', fontSize: 15 },

  // Password strength
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  strengthBarBg: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'right',
  },

  // Location hint
  locationHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  locationHintText: {
    fontSize: 12,
    color: 'rgba(162,184,255,0.5)',
  },

  // Terms
  termsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(162,184,255,0.5)',
    lineHeight: 17,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    paddingTop: 14,
    gap: 14,
  },
  nextBtn: { borderRadius: 16, overflow: 'hidden' },
  nextBtnGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  nextBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginHint: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  loginLink: { fontSize: 13, color: '#A2B8FF', fontWeight: '700' },

  // Picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#0C1832',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.6,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderColor: 'rgba(162,184,255,0.1)',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(162,184,255,0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  modalItemSelected: {
    backgroundColor: 'rgba(162,184,255,0.07)',
  },
  modalItemText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
  },
  modalItemTextSelected: {
    color: '#A2B8FF',
    fontWeight: '600',
  },
});
