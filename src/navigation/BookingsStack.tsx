import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BookingsStackParamList } from '../types/navigation';
import { MyBookingsScreen } from '../screens/Bookings/MyBookingsScreen';
import { ReservationDetailScreen } from '../screens/Bookings/ReservationDetailScreen';

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export function BookingsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
    </Stack.Navigator>
  );
}
