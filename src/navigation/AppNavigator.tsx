import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from './CustomTabBar';
import { HomeStack } from './HomeStack';
import { ExploreStack } from './ExploreStack';
import { ShopStack } from './ShopStack';
import { BookingsStack } from './BookingsStack';
import { ProfileStack } from './ProfileStack';
import { NotificationsModal } from '../components/NotificationsModal';
import { useUIStore } from '../stores/ui.store';

const Tab = createBottomTabNavigator();

export function AppNavigator() {
  const notifVisible = useUIStore((s) => s.isNotificationsOpen);
  const closeNotifications = useUIStore((s) => s.closeNotifications);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { position: 'absolute' },
        }}
      >
        <Tab.Screen name="HomeTab" component={HomeStack} />
        <Tab.Screen name="ExploreTab" component={ExploreStack} />
        <Tab.Screen name="ShopTab" component={ShopStack} />
        <Tab.Screen name="BookingsTab" component={BookingsStack} />
        <Tab.Screen name="ProfileTab" component={ProfileStack} />
      </Tab.Navigator>

      <NotificationsModal
        visible={notifVisible}
        onClose={closeNotifications}
      />
    </View>
  );
}
