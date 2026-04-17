import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerScheduleScreen } from '../screens/Owner/Schedule/OwnerScheduleScreen';
import { OwnerScheduleStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<OwnerScheduleStackParamList>();

export function OwnerScheduleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerSchedule" component={OwnerScheduleScreen} />
    </Stack.Navigator>
  );
}
