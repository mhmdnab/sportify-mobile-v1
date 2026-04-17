import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachAvailabilityStackParamList } from '../types/navigation';
import { CoachAvailabilityScreen } from '../screens/Coach/Availability/CoachAvailabilityScreen';

const Stack = createNativeStackNavigator<CoachAvailabilityStackParamList>();

export function CoachAvailabilityStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachAvailabilityScreen" component={CoachAvailabilityScreen} />
    </Stack.Navigator>
  );
}
