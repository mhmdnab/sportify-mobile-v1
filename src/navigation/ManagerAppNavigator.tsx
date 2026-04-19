import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { ManagerDashboardStack } from './ManagerDashboardStack';
import { ManagerScheduleStack } from './ManagerScheduleStack';
import { ManagerReservationsStack } from './ManagerReservationsStack';
import { ManagerClientsStack } from './ManagerClientsStack';
import { ProfileStack } from './ProfileStack';
import { managerTabs } from '../constants/managerTabs';
import { NotificationsModal } from '../components/NotificationsModal';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { useUIStore } from '../stores/ui.store';

const Tab = createBottomTabNavigator();

export function ManagerAppNavigator() {
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
        tabBar={(props) => <CustomTabBar {...props} tabConfig={managerTabs} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { position: 'absolute' },
        }}
      >
        <Tab.Screen name="ManagerDashboardTab" component={ManagerDashboardStack} />
        <Tab.Screen name="ManagerScheduleTab" component={ManagerScheduleStack} />
        <Tab.Screen name="ManagerReservationsTab" component={ManagerReservationsStack} />
        <Tab.Screen name="ManagerClientsTab" component={ManagerClientsStack} />
        <Tab.Screen name="ManagerProfileTab" component={ProfileStack} />
      </Tab.Navigator>

      <NotificationsModal visible={notifVisible} onClose={closeNotifications} />
      <ProfileDrawer visible={isDrawerOpen} onClose={closeDrawer} onNavigate={handleDrawerNavigate} />
    </View>
  );
}
