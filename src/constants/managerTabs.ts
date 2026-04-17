import { TabConfig } from './tabs';

export const managerTabs: TabConfig[] = [
  { name: 'ManagerDashboardTab', labelKey: 'tabs.dashboard', icon: 'grid-outline', activeIcon: 'grid' },
  { name: 'ManagerScheduleTab', labelKey: 'tabs.schedule', icon: 'calendar-outline', activeIcon: 'calendar' },
  { name: 'ManagerReservationsTab', labelKey: 'tabs.bookings', icon: 'receipt-outline', activeIcon: 'receipt' },
  { name: 'ManagerClientsTab', labelKey: 'tabs.clients', icon: 'people-outline', activeIcon: 'people' },
  { name: 'ManagerProfileTab', labelKey: 'tabs.profile', icon: 'person-outline', activeIcon: 'person' },
];
