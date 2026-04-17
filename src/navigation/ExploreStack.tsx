import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../types/navigation';
import { ExploreScreen } from '../screens/Explore/ExploreScreen';
import { VenueDetailScreen } from '../screens/Venue/VenueDetailScreen';
import { ReservationScreen } from '../screens/Venue/ReservationScreen';
import { BranchDetailScreen } from '../screens/Branch/BranchDetailScreen';
import { CoachesListScreen } from '../screens/Coaches/CoachesListScreen';
import { CoachProfileScreen } from '../screens/Coaches/CoachProfileScreen';
import { CoachVenueAvailabilityScreen } from '../screens/Coaches/CoachVenueAvailabilityScreen';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreScreen" component={ExploreScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
      <Stack.Screen name="CoachesList" component={CoachesListScreen} />
      <Stack.Screen name="CoachProfile" component={CoachProfileScreen} />
      <Stack.Screen name="CoachVenueAvailability" component={CoachVenueAvailabilityScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
    </Stack.Navigator>
  );
}
