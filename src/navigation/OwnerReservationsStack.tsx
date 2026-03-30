import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerReservationsStackParamList } from '../types/navigation';
import { OwnerReservationsScreen } from '../screens/Owner/Reservations/OwnerReservationsScreen';
import { OwnerReservationDetailScreen } from '../screens/Owner/Reservations/OwnerReservationDetailScreen';

const Stack = createNativeStackNavigator<OwnerReservationsStackParamList>();

export function OwnerReservationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerReservationsList" component={OwnerReservationsScreen} />
      <Stack.Screen name="OwnerReservationDetail" component={OwnerReservationDetailScreen} />
    </Stack.Navigator>
  );
}
