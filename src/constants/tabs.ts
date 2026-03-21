import { Ionicons } from '@expo/vector-icons';

export interface TabConfig {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

export const tabs: TabConfig[] = [
  { name: 'HomeTab', label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  { name: 'ExploreTab', label: 'Last Moments', icon: 'document-text-outline', activeIcon: 'document-text' },
  { name: 'BookingsTab', label: 'Schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'ProfileTab', label: 'Maps', icon: 'map-outline', activeIcon: 'map' },
];
