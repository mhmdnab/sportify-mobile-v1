import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerDashboardStackParamList } from '../types/navigation';
import { OwnerDashboardScreen } from '../screens/Owner/Dashboard/OwnerDashboardScreen';

const Stack = createNativeStackNavigator<OwnerDashboardStackParamList>();

export function OwnerDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
    </Stack.Navigator>
  );
}
