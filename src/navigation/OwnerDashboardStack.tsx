import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerDashboardStackParamList } from '../types/navigation';
import { OwnerDashboardScreen } from '../screens/Owner/Dashboard/OwnerDashboardScreen';
import { MyVenuesScreen } from '../screens/Owner/Venues/MyVenuesScreen';
import { VenueDetailScreen } from '../screens/Venue/VenueDetailScreen';
import { ReservationScreen } from '../screens/Venue/ReservationScreen';
import { BranchDetailScreen } from '../screens/Branch/BranchDetailScreen';

const Stack = createNativeStackNavigator<OwnerDashboardStackParamList>();

export function OwnerDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerDashboard" component={OwnerDashboardScreen} />
      <Stack.Screen name="MyVenuesScreen" component={MyVenuesScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
    </Stack.Navigator>
  );
}
