import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../types/navigation';
import { HomeScreen } from '../screens/Home/HomeScreen';
import { VenueDetailScreen } from '../screens/Venue/VenueDetailScreen';
import { ReservationScreen } from '../screens/Venue/ReservationScreen';
import { BranchDetailScreen } from '../screens/Branch/BranchDetailScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="Reservation" component={ReservationScreen} options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
    </Stack.Navigator>
  );
}
