import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { AuthStackParamList } from '../../types/navigation';

const CODE_LENGTH = 4;

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { email } = route.params;
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1******$3');

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = () => {
    const fullCode = code.join('');
    if (fullCode.length < CODE_LENGTH) return;
    // Show success state
    setVerified(true);
    // After a brief delay, navigate to login
    setTimeout(() => {
      navigation.navigate('Login');
    }, 1500);
  };

  if (verified) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={100} color={colors.navy} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.content}>
        {/* Envelope Icon */}
        <View style={styles.envelopeContainer}>
          <Ionicons name="mail-open-outline" size={80} color={colors.navy} />
          <View style={styles.arrowBadge}>
            <Ionicons name="arrow-up" size={20} color={colors.navy} />
          </View>
        </View>

        <Text style={styles.title}>{t('auth.verifyEmail')}</Text>
        <Text style={styles.subtitle}>
          {t('auth.enterCode')}{'\n'}
          <Text style={styles.emailText}>{maskedEmail}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <View key={index} style={styles.otpBox}>
              <TextInput
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={styles.otpInput}
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
              <View style={[styles.otpUnderline, digit ? styles.otpUnderlineActive : null]} />
            </View>
          ))}
        </View>

        {/* Resend */}
        <TouchableOpacity style={styles.resendButton}>
          <Text style={styles.resendText}>{t('auth.resendCode')}</Text>
        </TouchableOpacity>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            code.join('').length < CODE_LENGTH && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={code.join('').length < CODE_LENGTH}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>{t('auth.confirm')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  envelopeContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  arrowBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.navy,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  emailText: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  otpBox: {
    width: 50,
    alignItems: 'center',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.navy,
    textAlign: 'center',
    width: 50,
    height: 50,
    padding: 0,
  },
  otpUnderline: {
    width: 40,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  otpUnderlineActive: {
    backgroundColor: colors.navy,
  },
  resendButton: {
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: colors.error,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.navy,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 25,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  // Success state
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
