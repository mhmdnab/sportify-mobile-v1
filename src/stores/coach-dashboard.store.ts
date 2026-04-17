import { create } from 'zustand';
import { api } from '../lib/api';
import { CoachAvailability, Reservation } from '../types/api';

interface CoachDashboardData {
  pendingCount: number;
  confirmedCount: number;
  completedCount: number;
  upcomingToday: Reservation[];
  recentReservations: Reservation[];
  availabilities: CoachAvailability[];
}

interface CoachDashboardState extends CoachDashboardData {
  isLoading: boolean;
  error: string | null;
  fetchDashboardData: () => Promise<void>;
}

export const useCoachDashboardStore = create<CoachDashboardState>((set) => ({
  pendingCount: 0,
  confirmedCount: 0,
  completedCount: 0,
  upcomingToday: [],
  recentReservations: [],
  availabilities: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<{ data: CoachDashboardData }>('/coaches/me/dashboard');
      const data = res.data.data ?? res.data;
      set({
        pendingCount: data.pendingCount ?? 0,
        confirmedCount: data.confirmedCount ?? 0,
        completedCount: data.completedCount ?? 0,
        upcomingToday: data.upcomingToday ?? [],
        recentReservations: data.recentReservations ?? [],
        availabilities: data.availabilities ?? [],
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load dashboard data' });
    }
  },
}));
