import { create } from 'zustand';
import { api } from '../lib/api';
import { Branch, Venue, Reservation, PaginatedResponse } from '../types/api';

interface OwnerDashboardState {
  branchCount: number;
  venueCount: number;
  reservationCount: number;
  recentReservations: Reservation[];
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: () => Promise<void>;
}

export const useOwnerDashboardStore = create<OwnerDashboardState>((set) => ({
  branchCount: 0,
  venueCount: 0,
  reservationCount: 0,
  recentReservations: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [branchesRes, venuesRes, reservationsRes] = await Promise.all([
        api.get<PaginatedResponse<Branch>>('/branches/own', { params: { page: 1, limit: 1 } }),
        api.get<PaginatedResponse<Venue>>('/venues/own', { params: { page: 1, limit: 1 } }),
        api.get<PaginatedResponse<Reservation>>('/reservations/owner/all', { params: { page: 1, limit: 5 } }),
      ]);

      set({
        branchCount: branchesRes.data.total,
        venueCount: venuesRes.data.total,
        reservationCount: reservationsRes.data.total,
        recentReservations: reservationsRes.data.list,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.message || 'Failed to load dashboard data',
      });
    }
  },
}));
