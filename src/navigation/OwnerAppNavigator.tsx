import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { OwnerDashboardStack } from './OwnerDashboardStack';
import { OwnerBranchesStack } from './OwnerBranchesStack';
import { OwnerVenuesStack } from './OwnerVenuesStack';
import { OwnerReservationsStack } from './OwnerReservationsStack';
import { ProfileStack } from './ProfileStack';
import { ownerTabs } from '../constants/ownerTabs';

const Tab = createBottomTabNavigator();

export function OwnerAppNavigator() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} tabConfig={ownerTabs} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { position: 'absolute' },
        }}
      >
        <Tab.Screen name="DashboardTab" component={OwnerDashboardStack} />
        <Tab.Screen name="BranchesTab" component={OwnerBranchesStack} />
        <Tab.Screen name="VenuesTab" component={OwnerVenuesStack} />
        <Tab.Screen name="ReservationsTab" component={OwnerReservationsStack} />
        <Tab.Screen name="ProfileTab" component={ProfileStack} />
      </Tab.Navigator>
    </View>
  );
}
