import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManagerReservationsStackParamList } from '../types/navigation';
import { ManagerReservationsScreen } from '../screens/Manager/Reservations/ManagerReservationsScreen';
import { ManagerReservationDetailScreen } from '../screens/Manager/Reservations/ManagerReservationDetailScreen';

const Stack = createNativeStackNavigator<ManagerReservationsStackParamList>();

export function ManagerReservationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerReservationsList" component={ManagerReservationsScreen} />
      <Stack.Screen name="ManagerReservationDetail" component={ManagerReservationDetailScreen} />
    </Stack.Navigator>
  );
}
