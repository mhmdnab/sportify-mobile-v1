import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../types/navigation';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { EditProfileScreen } from '../screens/Profile/EditProfileScreen';
import { MyBookingsScreen } from '../screens/Bookings/MyBookingsScreen';
import { ReservationDetailScreen } from '../screens/Bookings/ReservationDetailScreen';
import { FAQsScreen } from '../screens/Profile/FAQsScreen';
import { BlogsScreen } from '../screens/Profile/BlogsScreen';
import { BlogDetailScreen } from '../screens/Profile/BlogDetailScreen';
import { TermsScreen } from '../screens/Profile/TermsScreen';
import { PrivacyScreen } from '../screens/Profile/PrivacyScreen';
import { ChangePasswordScreen } from '../screens/Profile/ChangePasswordScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="MyReservations" component={MyBookingsScreen} />
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
      <Stack.Screen name="FAQs" component={FAQsScreen} />
      <Stack.Screen name="Blogs" component={BlogsScreen} />
      <Stack.Screen name="BlogDetail" component={BlogDetailScreen} />
      <Stack.Screen name="Terms" component={TermsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}
