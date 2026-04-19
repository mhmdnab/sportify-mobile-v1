import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { CoachDashboardStack } from './CoachDashboardStack';
import { CoachScheduleStack } from './CoachScheduleStack';
import { CoachBookingsStack } from './CoachBookingsStack';
import { CoachAvailabilityStack } from './CoachAvailabilityStack';
import { ProfileStack } from './ProfileStack';
import { coachTabs } from '../constants/coachTabs';
import { NotificationsModal } from '../components/NotificationsModal';
import { ProfileDrawer } from '../components/ProfileDrawer';
import { useUIStore } from '../stores/ui.store';

const Tab = createBottomTabNavigator();

export function CoachAppNavigator() {
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
        tabBar={(props) => <CustomTabBar {...props} tabConfig={coachTabs} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { position: 'absolute' },
        }}
      >
        <Tab.Screen name="CoachDashboardTab" component={CoachDashboardStack} />
        <Tab.Screen name="CoachScheduleTab" component={CoachScheduleStack} />
        <Tab.Screen name="CoachBookingsTab" component={CoachBookingsStack} />
        <Tab.Screen name="CoachAvailabilityTab" component={CoachAvailabilityStack} />
        <Tab.Screen name="CoachProfileTab" component={ProfileStack} />
      </Tab.Navigator>

      <NotificationsModal visible={notifVisible} onClose={closeNotifications} />
      <ProfileDrawer visible={isDrawerOpen} onClose={closeDrawer} onNavigate={handleDrawerNavigate} />
    </View>
  );
}
