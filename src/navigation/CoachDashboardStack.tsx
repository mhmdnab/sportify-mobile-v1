import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CoachDashboardStackParamList } from '../types/navigation';
import { CoachDashboardScreen } from '../screens/Coach/Dashboard/CoachDashboardScreen';
import { StadiumsScreen } from '../screens/Stadiums/StadiumsScreen';
import { VenueDetailScreen } from '../screens/Venue/VenueDetailScreen';
import { BranchDetailScreen } from '../screens/Branch/BranchDetailScreen';
import { ReservationScreen } from '../screens/Venue/ReservationScreen';
import { ReservationDetailScreen } from '../screens/Bookings/ReservationDetailScreen';

const Stack = createNativeStackNavigator<CoachDashboardStackParamList>();

export function CoachDashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
      <Stack.Screen name="StadiumsScreen" component={StadiumsScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="ReservationDetail" component={ReservationDetailScreen} />
    </Stack.Navigator>
  );
}
