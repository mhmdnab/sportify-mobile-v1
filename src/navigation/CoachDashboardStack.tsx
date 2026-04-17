import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachDashboardStackParamList } from '../types/navigation';
import { CoachDashboardScreen } from '../screens/Coach/Dashboard/CoachDashboardScreen';

const Stack = createNativeStackNavigator<CoachDashboardStackParamList>();

export function CoachDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
    </Stack.Navigator>
  );
}
