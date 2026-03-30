import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerVenuesStackParamList } from '../types/navigation';
import { OwnerVenuesScreen } from '../screens/Owner/Venues/OwnerVenuesScreen';
import { OwnerVenueDetailScreen } from '../screens/Owner/Venues/OwnerVenueDetailScreen';

const Stack = createNativeStackNavigator<OwnerVenuesStackParamList>();

export function OwnerVenuesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerVenuesList" component={OwnerVenuesScreen} />
      <Stack.Screen name="OwnerVenueDetail" component={OwnerVenueDetailScreen} />
    </Stack.Navigator>
  );
}
