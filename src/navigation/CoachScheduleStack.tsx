import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachScheduleStackParamList } from '../types/navigation';
import { CoachScheduleScreen } from '../screens/Coach/Schedule/CoachScheduleScreen';

const Stack = createNativeStackNavigator<CoachScheduleStackParamList>();

export function CoachScheduleStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachSchedule" component={CoachScheduleScreen} />
    </Stack.Navigator>
  );
}
