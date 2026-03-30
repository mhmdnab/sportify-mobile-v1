import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LastMomentsScreen } from '../screens/LastMoments/LastMomentsScreen';

const Stack = createNativeStackNavigator();

export function LastMomentsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LastMomentsScreen" component={LastMomentsScreen} />
    </Stack.Navigator>
  );
}
