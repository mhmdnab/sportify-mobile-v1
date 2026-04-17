import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachBookingsStackParamList } from '../types/navigation';
import { CoachBookingsScreen } from '../screens/Coach/Bookings/CoachBookingsScreen';
import { CoachBookingDetailScreen } from '../screens/Coach/Bookings/CoachBookingDetailScreen';

const Stack = createNativeStackNavigator<CoachBookingsStackParamList>();

export function CoachBookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachBookingsList" component={CoachBookingsScreen} />
      <Stack.Screen name="CoachBookingDetail" component={CoachBookingDetailScreen} />
    </Stack.Navigator>
  );
}
