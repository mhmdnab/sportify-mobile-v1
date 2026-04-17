import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManagerClientsStackParamList } from '../types/navigation';
import { ManagerClientsScreen } from '../screens/Manager/Clients/ManagerClientsScreen';
import { ManagerClientDetailScreen } from '../screens/Manager/Clients/ManagerClientDetailScreen';

const Stack = createNativeStackNavigator<ManagerClientsStackParamList>();

export function ManagerClientsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerClients" component={ManagerClientsScreen} />
      <Stack.Screen name="ManagerClientDetail" component={ManagerClientDetailScreen} />
    </Stack.Navigator>
  );
}
