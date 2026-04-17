import { create } from 'zustand';
import { api } from '../lib/api';
import { Reservation, ReservationStatus, PaginatedResponse } from '../types/api';

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

interface PeakHour { hour: string; count: number }
interface PeakVenue { venueId: number; venueName: string; count: number }

interface ManagerDashboardState {
  daily: number;
  monthly: number;
  yearly: number;
  peakHours: PeakHour[];
  peakVenues: PeakVenue[];
  todayConfirmed: number;
  todayPending: number;
  todayPaid: number;
  todayRevenue: number;
  upcomingToday: Reservation[];
  recentReservations: Reservation[];
  revenueTrend: number[];
  isLoading: boolean;
  error: string | null;

  fetchDashboardData: () => Promise<void>;
}

export const useManagerDashboardStore = create<ManagerDashboardState>((set) => ({
  daily: 0,
  monthly: 0,
  yearly: 0,
  peakHours: [],
  peakVenues: [],
  todayConfirmed: 0,
  todayPending: 0,
  todayPaid: 0,
  todayRevenue: 0,
  upcomingToday: [],
  recentReservations: [],
  revenueTrend: [],
  isLoading: false,
  error: null,

  fetchDashboardData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [analyticsRes, reservationsRes] = await Promise.all([
        api.get<{ data: { peakHours: PeakHour[]; peakVenues: PeakVenue[]; counts: { daily: number; monthly: number; yearly: number } } }>(
          '/reservations/manager/analytics',
        ),
        api.get<PaginatedResponse<Reservation>>('/reservations/manager/all', {
          params: { page: 1, limit: 100 },
        }),
      ]);

      const { peakHours, peakVenues, counts } = analyticsRes.data.data;
      const list: Reservation[] = reservationsRes.data.list;

      const today = new Date().toISOString().split('T')[0];
      const todayList = list.filter((r) => r.slotDate?.startsWith(today));

      const todayConfirmed = todayList.filter((r) => r.status === ReservationStatus.CONFIRMED).length;
      const todayPending = todayList.filter((r) => r.status === ReservationStatus.PENDING).length;
      const todayPaid = todayList.filter((r) => r.status === ReservationStatus.PAID).length;
      const todayRevenue = todayList
        .filter((r) => r.status !== ReservationStatus.CANCELLED && r.status !== ReservationStatus.REJECTED)
        .reduce((sum, r) => sum + (r.slot?.price ?? 0) * (r.repeatCount || 1), 0);

      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const upcomingToday = todayList
        .filter((r) => r.status === ReservationStatus.CONFIRMED && r.slot?.startTime)
        .filter((r) => toMin(r.slot!.startTime) >= nowMin)
        .sort((a, b) => toMin(a.slot!.startTime) - toMin(b.slot!.startTime));

      const revenueTrend = list
        .filter((r) => r.slot?.price && r.slot.price > 0)
        .slice(0, 7)
        .map((r) => r.slot!.price)
        .reverse();

      set({
        daily: counts.daily,
        monthly: counts.monthly,
        yearly: counts.yearly,
        peakHours,
        peakVenues,
        todayConfirmed,
        todayPending,
        todayPaid,
        todayRevenue,
        upcomingToday,
        recentReservations: list.slice(0, 6),
        revenueTrend,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load dashboard data' });
    }
  },
}));
