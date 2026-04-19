import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManagerDashboardStackParamList } from '../types/navigation';
import { ManagerDashboardScreen } from '../screens/Manager/Dashboard/ManagerDashboardScreen';
import { MyVenuesScreen } from '../screens/Owner/Venues/MyVenuesScreen';
import { VenueDetailScreen } from '../screens/Venue/VenueDetailScreen';
import { ReservationScreen } from '../screens/Venue/ReservationScreen';
import { BranchDetailScreen } from '../screens/Branch/BranchDetailScreen';

const Stack = createNativeStackNavigator<ManagerDashboardStackParamList>();

export function ManagerDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerDashboard" component={ManagerDashboardScreen} />
      <Stack.Screen name="MyVenuesScreen" component={MyVenuesScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
    </Stack.Navigator>
  );
}
