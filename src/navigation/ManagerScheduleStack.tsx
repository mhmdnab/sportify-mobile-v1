import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManagerScheduleStackParamList } from '../types/navigation';
import { ManagerScheduleScreen } from '../screens/Manager/Schedule/ManagerScheduleScreen';

const Stack = createNativeStackNavigator<ManagerScheduleStackParamList>();

export function ManagerScheduleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerSchedule" component={ManagerScheduleScreen} />
    </Stack.Navigator>
  );
}
