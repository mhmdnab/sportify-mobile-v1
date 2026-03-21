import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { AuthStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyEmail'>;

export function VerifyEmailScreen({ route, navigation }: Props) {
  const { email } = route.params;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={64} color={colors.primary} />
        </View>

        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.subtitle}>
          We've sent a verification link to{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>
        <Text style={styles.hint}>
          Click the link in the email to verify your account, then come back and sign in.
        </Text>

        <View style={styles.actions}>
          <Button
            title="Go to Sign In"
            onPress={() => navigation.navigate('Login')}
          />
          <Button
            title="Resend Email"
            onPress={() => {}}
            variant="ghost"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hint: {
    fontSize: 14,
    color: colors.textHint,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    marginTop: 40,
  },
});
