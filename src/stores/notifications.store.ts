import { create } from 'zustand';
import { api } from '../lib/api';
import { Notification, PaginatedResponse } from '../types/api';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;

  fetchNotifications: (params?: { page?: number; limit?: number }) => Promise<void>;
  fetchMoreNotifications: () => Promise<void>;
  reset: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  page: 1,
  hasNext: false,

  fetchNotifications: async (params) => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const response = await api.get<PaginatedResponse<Notification>>('/notifications/own', {
        params: { page: 1, limit: 20, column: 'createdAt', order: 'desc', ...params },
      });
      const notifications = response.data.list;
      const unreadCount = notifications.filter((n) => !n.isRead).length;
      set({
        notifications,
        unreadCount,
        hasNext: response.data.hasNext,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch notifications',
      });
    }
  },

  fetchMoreNotifications: async () => {
    const { hasNext, page, isLoading } = get();
    if (!hasNext || isLoading) return;

    set({ isLoading: true });
    try {
      const nextPage = page + 1;
      const response = await api.get<PaginatedResponse<Notification>>('/notifications/own', {
        params: { page: nextPage, limit: 20, column: 'createdAt', order: 'desc' },
      });
      set((state) => ({
        notifications: [...state.notifications, ...response.data.list],
        page: nextPage,
        hasNext: response.data.hasNext,
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  reset: () => set({ notifications: [], page: 1, hasNext: false }),
}));
