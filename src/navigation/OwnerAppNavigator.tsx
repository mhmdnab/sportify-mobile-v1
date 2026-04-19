import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { OwnerDashboardStack } from './OwnerDashboardStack';
import { OwnerScheduleStack } from './OwnerScheduleStack';
import { OwnerVenuesStack } from './OwnerVenuesStack';
import { OwnerReservationsStack } from './OwnerReservationsStack';
import { ProfileStack } from './ProfileStack';
import { ownerTabs } from '../constants/ownerTabs';
import { NotificationsModal } from '../components/NotificationsModal';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { useUIStore } from '../stores/ui.store';

const Tab = createBottomTabNavigator();

export function OwnerAppNavigator() {
  const notifVisible = useUIStore((s) => s.isNotificationsOpen);
  const closeNotifications = useUIStore((s) => s.closeNotifications);
  const isDrawerOpen = useUIStore((s) => s.isDrawerOpen);
  const closeDrawer = useUIStore((s) => s.closeDrawer);

  const handleDrawerNavigate = (screen: string) => {
    closeDrawer();
  };

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
        <Tab.Screen name="ScheduleTab" component={OwnerScheduleStack} />
        <Tab.Screen name="VenuesTab" component={OwnerVenuesStack} />
        <Tab.Screen name="ReservationsTab" component={OwnerReservationsStack} />
        <Tab.Screen name="ProfileTab" component={ProfileStack} />
      </Tab.Navigator>

      <NotificationsModal visible={notifVisible} onClose={closeNotifications} />
      <ProfileDrawer visible={isDrawerOpen} onClose={closeDrawer} onNavigate={handleDrawerNavigate} />
    </View>
  );
}
