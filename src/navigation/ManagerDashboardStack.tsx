import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManagerDashboardStackParamList } from '../types/navigation';
import { ManagerDashboardScreen } from '../screens/Manager/Dashboard/ManagerDashboardScreen';

const Stack = createNativeStackNavigator<ManagerDashboardStackParamList>();

export function ManagerDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} />
    </Stack.Navigator>
  );
}
