import { create } from 'zustand';
import { api } from '../lib/api';
import { Branch, Venue, Reservation, ReservationStatus, PaginatedResponse } from '../types/api';

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

interface OwnerDashboardState {
  branchCount: number;
  venueCount: number;
  reservationCount: number;
  todayConfirmed: number;
  todayPending: number;
  todayRevenue: number;
  upcomingToday: Reservation[];   // today's CONFIRMED, sorted by slot time, not yet passed
  recentReservations: Reservation[];
  revenueTrend: number[];         // last 7 slot prices for sparkline
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: () => Promise<void>;
}

export const useOwnerDashboardStore = create<OwnerDashboardState>((set) => ({
  branchCount: 0,
  venueCount: 0,
  reservationCount: 0,
  todayConfirmed: 0,
  todayPending: 0,
  todayRevenue: 0,
  upcomingToday: [],
  recentReservations: [],
  revenueTrend: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [branchesRes, venuesRes, reservationsRes] = await Promise.all([
        api.get<PaginatedResponse<Branch>>('/branches/own', { params: { page: 1, limit: 1 } }),
        api.get<PaginatedResponse<Venue>>('/venues/own', { params: { page: 1, limit: 1 } }),
        api.get<PaginatedResponse<Reservation>>('/reservations/owner/all', { params: { page: 1, limit: 100 } }),
      ]);

      const list: Reservation[] = reservationsRes.data.list;
      const today = new Date().toISOString().split('T')[0];
      const todayList = list.filter((r) => r.slotDate?.startsWith(today));

      const todayConfirmed = todayList.filter((r) => r.status === ReservationStatus.CONFIRMED).length;
      const todayPending = todayList.filter((r) => r.status === ReservationStatus.PENDING).length;
      const todayRevenue = todayList
        .filter((r) => r.status !== ReservationStatus.CANCELLED && r.status !== ReservationStatus.REJECTED)
        .reduce((sum, r) => sum + (r.slot?.price ?? 0) * (r.repeatCount || 1), 0);

      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const upcomingToday = todayList
        .filter((r) => r.status === ReservationStatus.CONFIRMED && r.slot?.startTime)
        .filter((r) => toMin(r.slot!.startTime) >= nowMin)
        .sort((a, b) => toMin(a.slot!.startTime) - toMin(b.slot!.startTime));

      // sparkline: last 7 non-zero prices from the full list
      const revenueTrend = list
        .filter((r) => r.slot?.price && r.slot.price > 0)
        .slice(0, 7)
        .map((r) => r.slot!.price)
        .reverse();

      set({
        branchCount: branchesRes.data.total,
        venueCount: venuesRes.data.total,
        reservationCount: reservationsRes.data.total,
        todayConfirmed,
        todayPending,
        todayRevenue,
        upcomingToday,
        recentReservations: list.slice(0, 6),
        revenueTrend,
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
