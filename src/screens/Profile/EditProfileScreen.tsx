import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { spacing } from '../../theme/spacing';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../stores/theme.store';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/api';
import { BackgroundShapes } from '../../components/ui/BackgroundShapes';

export function EditProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const tc = useThemeColors();
  const isDark = useThemeStore((s) => s.isDark);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.put('/users/profile', { name, phone: phone || undefined });
      await refreshProfile();
      Alert.alert('Success', 'Profile updated successfully.');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tc.screenBg }]}>
      <BackgroundShapes isDark={isDark} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={tc.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: tc.textPrimary }]}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.avatarSection}>
        <Avatar uri={user?.image} name={user?.name} size={80} />
      </View>

      <View style={styles.form}>
        <Input
          label="Full Name"
          placeholder="Enter your name"
          value={name}
          onChangeText={setName}
          leftIcon="person-outline"
        />
        <Input
          label="Email"
          value={user?.email || ''}
          editable={false}
          leftIcon="mail-outline"
        />
        <Input
          label="Phone"
          placeholder="Enter your phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          leftIcon="call-outline"
        />

        <Button title="Save Changes" onPress={handleSave} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  form: {
    paddingHorizontal: spacing.screenPadding,
  },
});
