import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NotificationsStackParamList } from '../types/navigation';
import { NotificationsScreen } from '../screens/Notifications/NotificationsScreen';

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export function NotificationsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NotificationsScreen" component={NotificationsScreen} />
    </Stack.Navigator>
  );
}
