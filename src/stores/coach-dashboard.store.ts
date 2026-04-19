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

interface CoachEarnings {
  total: number;
  thisMonth: number;
  thisWeek: number;
  sessionCount: number;
}

interface CoachDashboardState extends CoachDashboardData {
  isLoading: boolean;
  error: string | null;
  earnings: CoachEarnings;
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
  earnings: { total: 0, thisMonth: 0, thisWeek: 0, sessionCount: 0 },

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [dashRes, earningsRes] = await Promise.all([
        api.get<{ data: CoachDashboardData }>('/coaches/me/dashboard'),
        api.get<{ data: CoachEarnings }>('/coaches/me/earnings'),
      ]);
      const data = dashRes.data.data ?? dashRes.data;
      const earningsData = earningsRes.data.data ?? earningsRes.data;
      set({
        pendingCount: data.pendingCount ?? 0,
        confirmedCount: data.confirmedCount ?? 0,
        completedCount: data.completedCount ?? 0,
        upcomingToday: data.upcomingToday ?? [],
        recentReservations: data.recentReservations ?? [],
        availabilities: data.availabilities ?? [],
        earnings: {
          total: earningsData.total ?? 0,
          thisMonth: earningsData.thisMonth ?? 0,
          thisWeek: earningsData.thisWeek ?? 0,
          sessionCount: earningsData.sessionCount ?? 0,
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load dashboard data' });
    }
  },
}));
