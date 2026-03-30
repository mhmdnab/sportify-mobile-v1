import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OwnerBranchesStackParamList } from '../types/navigation';
import { OwnerBranchesScreen } from '../screens/Owner/Branches/OwnerBranchesScreen';
import { OwnerBranchDetailScreen } from '../screens/Owner/Branches/OwnerBranchDetailScreen';

const Stack = createNativeStackNavigator<OwnerBranchesStackParamList>();

export function OwnerBranchesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OwnerBranchesList" component={OwnerBranchesScreen} />
      <Stack.Screen name="OwnerBranchDetail" component={OwnerBranchDetailScreen} />
    </Stack.Navigator>
  );
}
