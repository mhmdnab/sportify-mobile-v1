import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExploreStackParamList } from '../types/navigation';
import { ExploreScreen } from '../screens/Explore/ExploreScreen';
import { VenueDetailScreen } from '../screens/Venue/VenueDetailScreen';
import { BranchDetailScreen } from '../screens/Branch/BranchDetailScreen';

const Stack = createNativeStackNavigator<ExploreStackParamList>();

export function ExploreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExploreScreen" component={ExploreScreen} />
      <Stack.Screen name="VenueDetail" component={VenueDetailScreen} />
      <Stack.Screen name="BranchDetail" component={BranchDetailScreen} />
    </Stack.Navigator>
  );
}
