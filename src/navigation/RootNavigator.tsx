import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SplashScreen } from '../screens/Splash/SplashScreen';
import { OnboardingScreen } from '../screens/Onboarding/OnboardingScreen';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { OwnerAppNavigator } from './OwnerAppNavigator';
import { ManagerAppNavigator } from './ManagerAppNavigator';
import { CoachAppNavigator } from './CoachAppNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="App" component={AppNavigator} />
      <Stack.Screen name="OwnerApp" component={OwnerAppNavigator} />
      <Stack.Screen name="ManagerApp" component={ManagerAppNavigator} />
      <Stack.Screen name="CoachApp" component={CoachAppNavigator} />
    </Stack.Navigator>
  );
}
