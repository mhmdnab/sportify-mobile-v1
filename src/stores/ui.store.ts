import { create } from 'zustand';

interface UIState {
  isDrawerOpen: boolean;
  isNotificationsOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isDrawerOpen: false,
  isNotificationsOpen: false,
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false }),
  openNotifications: () => set({ isNotificationsOpen: true }),
  closeNotifications: () => set({ isNotificationsOpen: false }),
}));
