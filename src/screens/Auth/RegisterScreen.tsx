import React, { useState, useMemo } from 'react';
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
  Dimensions,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../stores/auth.store';
import { isValidEmail, isStrongPassword, isValidName } from '../../utils/validation';
import { AuthStackParamList } from '../../types/navigation';
import { StepIndicator } from '../../components/ui/StepIndicator';
import { useTranslation } from 'react-i18next';
import { countries, Country } from '../../constants/countries';

const { height } = Dimensions.get('window');
const TOTAL_STEPS = 4;

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

type PickerModalType = 'country' | 'city' | 'phoneCountry' | null;

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

  const cityOptions = useMemo(
    () => selectedCountry?.cities ?? [],
    [selectedCountry],
  );

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
          ? {
              country: selectedCountry.name,
              city: selectedCity,
            }
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
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Picker modal for country/city selection
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
      data = countries.map((c) => ({
        label: `${c.flag}  ${c.name} (${c.phoneCode})`,
        value: c.code,
        extra: c,
      }));
    }

    return (
      <Modal visible={pickerModal !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={() => setPickerModal(null)}>
                <Ionicons name="close" size={24} color={colors.navy} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={data}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
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
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {((pickerModal === 'country' && selectedCountry?.code === item.value) ||
                    (pickerModal === 'city' && selectedCity === item.value) ||
                    (pickerModal === 'phoneCountry' && selectedPhoneCountry.code === item.value)) && (
                    <Ionicons name="checkmark" size={20} color={colors.navy} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return renderGenderStep();
      case 1:
        return renderInfoStep();
      case 2:
        return renderLocationStep();
      case 3:
        return renderPasswordStep();
      default:
        return null;
    }
  };

  const renderGenderStep = () => (
    <View style={styles.genderContainer}>
      <TouchableOpacity
        style={[styles.genderCard, gender === 'FEMALE' && styles.genderCardSelected]}
        onPress={() => setGender('FEMALE')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.6)']}
          style={styles.genderGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Ionicons name="woman" size={80} color="rgba(255,255,255,0.3)" style={styles.genderIcon} />
          <View style={[styles.genderLabel, gender === 'FEMALE' && styles.genderLabelSelected]}>
            <Text style={[styles.genderText, gender === 'FEMALE' && styles.genderTextSelected]}>{t('auth.female')}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.genderCard, gender === 'MALE' && styles.genderCardSelected]}
        onPress={() => setGender('MALE')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.6)']}
          style={styles.genderGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Ionicons name="man" size={80} color="rgba(255,255,255,0.3)" style={styles.genderIcon} />
          <View style={[styles.genderLabel, gender === 'MALE' && styles.genderLabelSelected]}>
            <Text style={[styles.genderText, gender === 'MALE' && styles.genderTextSelected]}>{t('auth.male')}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {errors.gender && <Text style={styles.errorTextWhite}>{errors.gender}</Text>}
    </View>
  );

  const renderInfoStep = () => (
    <View style={styles.stepContent}>
      {/* Social buttons */}
      <View style={styles.socialRow}>
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-facebook" size={24} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-google" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Username */}
      <View style={styles.darkFieldContainer}>
        <TextInput
          style={styles.darkFieldInput}
          value={name}
          onChangeText={setName}
          placeholder={t('auth.username')}
          placeholderTextColor="rgba(255,255,255,0.5)"
        />
      </View>
      {errors.name && <Text style={styles.errorTextWhite}>{errors.name}</Text>}

      {/* Email */}
      <View style={styles.darkFieldContainer}>
        <TextInput
          style={styles.darkFieldInput}
          value={email}
          onChangeText={setEmail}
          placeholder={t('auth.email')}
          placeholderTextColor="rgba(255,255,255,0.5)"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>
      {errors.email && <Text style={styles.errorTextWhite}>{errors.email}</Text>}

      {/* Date of Birth */}
      <TouchableOpacity
        style={styles.darkFieldContainer}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.darkFieldInput, !dateOfBirth && styles.placeholderText]}>
          {dateOfBirth ? formatDate(dateOfBirth) : t('auth.dateOfBirth')}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>

      {showDatePicker && (
        <View>
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
            <TouchableOpacity
              style={styles.datePickerDone}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.datePickerDoneText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Phone Number with Country Code */}
      <View style={styles.darkFieldContainer}>
        <TouchableOpacity
          style={styles.phonePrefix}
          onPress={() => setPickerModal('phoneCountry')}
        >
          <Text style={styles.phonePrefixText}>
            {selectedPhoneCountry.flag} {selectedPhoneCountry.phoneCode}
          </Text>
          <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
        <TextInput
          style={[styles.darkFieldInput, { flex: 1 }]}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('auth.phoneNumber')}
          placeholderTextColor="rgba(255,255,255,0.5)"
          keyboardType="phone-pad"
        />
      </View>
    </View>
  );

  const renderLocationStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('auth.chooseCountryCity')}</Text>

      {/* Country Dropdown */}
      <TouchableOpacity
        style={styles.darkFieldContainer}
        onPress={() => setPickerModal('country')}
        activeOpacity={0.7}
      >
        <Text style={[styles.darkFieldInput, !selectedCountry && styles.placeholderText]}>
          {selectedCountry ? `${selectedCountry.flag}  ${selectedCountry.name}` : t('auth.country')}
        </Text>
        <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
      {errors.country && <Text style={styles.errorTextWhite}>{errors.country}</Text>}

      {/* City Dropdown */}
      <TouchableOpacity
        style={[styles.darkFieldContainer, !selectedCountry && styles.fieldDisabled]}
        onPress={() => selectedCountry && setPickerModal('city')}
        activeOpacity={selectedCountry ? 0.7 : 1}
      >
        <Text style={[styles.darkFieldInput, !selectedCity && styles.placeholderText]}>
          {selectedCity || t('auth.city')}
        </Text>
        <Ionicons name="chevron-down" size={20} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
      {errors.city && <Text style={styles.errorTextWhite}>{errors.city}</Text>}
    </View>
  );

  const renderPasswordStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{t('auth.securePassword')}</Text>

      <View style={styles.darkFieldContainer}>
        <TextInput
          style={styles.darkFieldInput}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.password')}
          placeholderTextColor="rgba(255,255,255,0.5)"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color="rgba(255,255,255,0.5)"
          />
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.errorTextWhite}>{errors.password}</Text>}

      <View style={styles.darkFieldContainer}>
        <TextInput
          style={styles.darkFieldInput}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder={t('auth.confirmPassword')}
          placeholderTextColor="rgba(255,255,255,0.5)"
          secureTextEntry={!showConfirmPassword}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Ionicons
            name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
            size={20}
            color="rgba(255,255,255,0.5)"
          />
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && <Text style={styles.errorTextWhite}>{errors.confirmPassword}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[colors.navyDark, colors.navy, colors.navyDark]}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header with back button and logo */}
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
              <Image source={require('../../../assets/logo.png')} style={{ width: 80, height: 40 }} contentFit="contain" />
              <View style={{ width: 24 }} />
            </View>

            {/* Step Indicator */}
            <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} />

            {/* Step Content */}
            {renderStepContent()}
          </ScrollView>

          {/* Next Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {step === TOTAL_STEPS - 1
                  ? isLoading
                    ? t('auth.creatingAccount')
                    : t('auth.next')
                  : t('auth.next')}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      {/* Picker Modal */}
      {renderPickerModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },

  // Gender Step
  genderContainer: {
    flex: 1,
    paddingTop: 20,
  },
  genderCard: {
    height: height * 0.28,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: colors.navyLight,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderCardSelected: {
    borderColor: colors.white,
  },
  genderGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 20,
  },
  genderIcon: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    left: '35%',
  },
  genderLabel: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 25,
  },
  genderLabelSelected: {
    backgroundColor: colors.white,
  },
  genderText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: colors.navy,
  },

  // Info Step
  stepContent: {
    paddingTop: 24,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 28,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Dark fields (for registration steps)
  darkFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 14,
    height: 50,
  },
  darkFieldInput: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    paddingVertical: 0,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.5)',
  },
  fieldDisabled: {
    opacity: 0.5,
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.3)',
    gap: 4,
  },
  phonePrefixText: {
    color: colors.white,
    fontSize: 14,
  },
  errorTextWhite: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 20,
  },

  // Date picker
  datePickerDone: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  datePickerDoneText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Button
  buttonContainer: {
    paddingHorizontal: 60,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    paddingTop: 16,
  },
  nextButton: {
    backgroundColor: colors.navyDark,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.6,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
});
