import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { api } from '../../lib/api';
import { spacing } from '../../theme/spacing';

export function ChangePasswordScreen() {
  const navigation = useNavigation();
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const cardBg = isDark ? '#0C1832' : '#FFFFFF';
  const screenBg = isDark ? '#0A0F1E' : '#F0F2F8';

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!currentPassword) errs.currentPassword = 'Current password is required';
    if (!newPassword) errs.newPassword = 'New password is required';
    else if (newPassword.length < 8) errs.newPassword = 'Password must be at least 8 characters';
    if (!confirmPassword) errs.confirmPassword = 'Please confirm your new password';
    else if (newPassword !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
    if (currentPassword && newPassword && currentPassword === newPassword)
      errs.newPassword = 'New password must differ from current password';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Your password has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    field: string,
    show: boolean,
    toggleShow: () => void,
    icon: string,
    error?: string,
  ) => (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: tc.textHint }]}>{label}</Text>
      <View style={[
        styles.inputRow,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
        focusedField === field && { borderColor: isDark ? '#A2B8FF' : '#0B1A3E', backgroundColor: isDark ? 'rgba(162,184,255,0.07)' : 'rgba(11,26,62,0.04)' },
        !!error && { borderColor: '#FF6B6B' },
      ]}>
        <Ionicons
          name={icon as any}
          size={17}
          color={focusedField === field ? (isDark ? '#A2B8FF' : '#0B1A3E') : tc.textHint}
          style={styles.inputIcon}
        />
        <TextInput
          style={[styles.input, { color: tc.textPrimary, flex: 1 }]}
          value={value}
          onChangeText={(v) => { onChange(v); setErrors((e) => ({ ...e, [field]: undefined })); }}
          secureTextEntry={!show}
          placeholder="••••••••"
          placeholderTextColor={tc.textHint}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
        />
        <TouchableOpacity onPress={toggleShow} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={show ? 'eye-outline' : 'eye-off-outline'} size={17} color={tc.textHint} />
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: tc.textPrimary }]}>Change Password</Text>
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Info banner */}
          <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(162,184,255,0.07)' : 'rgba(11,26,62,0.06)', borderColor: isDark ? 'rgba(162,184,255,0.12)' : 'rgba(11,26,62,0.1)' }]}>
            <Ionicons name="shield-checkmark-outline" size={18} color={isDark ? '#A2B8FF' : '#0B1A3E'} />
            <Text style={[styles.infoBannerText, { color: isDark ? 'rgba(162,184,255,0.8)' : '#0B1A3E' }]}>
              Use at least 8 characters with uppercase, numbers, and symbols for a strong password.
            </Text>
          </View>

          {/* Form card */}
          <View style={[styles.card, { backgroundColor: cardBg }, isDark && { borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }]}>
            {renderInput(
              'Current Password',
              currentPassword,
              setCurrentPassword,
              'currentPassword',
              showCurrent,
              () => setShowCurrent(!showCurrent),
              'lock-closed-outline',
              errors.currentPassword,
            )}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            {renderInput(
              'New Password',
              newPassword,
              setNewPassword,
              'newPassword',
              showNew,
              () => setShowNew(!showNew),
              'lock-open-outline',
              errors.newPassword,
            )}
            <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            {renderInput(
              'Confirm New Password',
              confirmPassword,
              setConfirmPassword,
              'confirmPassword',
              showConfirm,
              () => setShowConfirm(!showConfirm),
              'shield-checkmark-outline',
              errors.confirmPassword,
            )}
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: isDark ? '#1D4ED8' : '#0B1A3E' }, loading && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={styles.saveBtnInner}>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Update Password</Text>
                </View>
              )
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },

  scroll: { padding: spacing.lg, gap: 16, paddingBottom: 40 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoBannerText: { flex: 1, fontSize: 13, lineHeight: 19 },

  card: {
    borderRadius: 18,
    padding: spacing.lg,
    gap: 4,
  },
  divider: { height: 1, marginVertical: 8 },

  fieldWrap: { gap: 7 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  inputIcon: { marginRight: 10 },
  input: { fontSize: 15, paddingVertical: 0 },
  error: { fontSize: 12, color: '#FF6B6B', marginLeft: 2 },

  saveBtn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
