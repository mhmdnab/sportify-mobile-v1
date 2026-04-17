import { TabConfig } from './tabs';

export const coachTabs: TabConfig[] = [
  { name: 'CoachDashboardTab', labelKey: 'tabs.dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'CoachScheduleTab', labelKey: 'tabs.schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'CoachBookingsTab', labelKey: 'tabs.bookings', icon: 'receipt-outline', activeIcon: 'receipt' },
  { name: 'CoachAvailabilityTab', labelKey: 'tabs.availability', icon: 'time-outline', activeIcon: 'time' },
  { name: 'CoachProfileTab', labelKey: 'tabs.profile', icon: 'person-outline', activeIcon: 'person' },
];
