import { create } from 'zustand';
import { api } from '../lib/api';
import { PaginatedResponse, Reservation, ReservationStatus } from '../types/api';

interface CoachReservationsState {
  reservations: Reservation[];
  allReservations: Reservation[];
  currentReservation: Reservation | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  isLoadingSchedule: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;
  total: number;
  statusFilter: ReservationStatus | null;

  fetchCoachReservations: (refresh?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchForSchedule: () => Promise<void>;
  fetchReservationById: (id: number) => Promise<void>;
  acceptReservation: (id: number) => Promise<void>;
  rejectReservation: (id: number) => Promise<void>;
  markAsPaid: (id: number) => Promise<void>;
  setStatusFilter: (status: ReservationStatus | null) => void;
}

export const useCoachReservationsStore = create<CoachReservationsState>((set, get) => ({
  reservations: [],
  allReservations: [],
  currentReservation: null,
  isLoading: false,
  isLoadingDetail: false,
  isLoadingSchedule: false,
  error: null,
  page: 1,
  hasNext: false,
  total: 0,
  statusFilter: null,

  fetchCoachReservations: async (refresh = true) => {
    set({ isLoading: true, error: null });
    try {
      const { statusFilter } = get();
      const res = await api.get<PaginatedResponse<Reservation>>('/coaches/me/reservations', {
        params: {
          page: 1,
          limit: 10,
          ...(statusFilter && { status: statusFilter }),
        },
      });
      set({
        reservations: res.data.list,
        page: 1,
        hasNext: res.data.hasNext,
        total: res.data.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load reservations' });
    }
  },

  fetchMore: async () => {
    const { hasNext, page, reservations, statusFilter } = get();
    if (!hasNext) return;
    try {
      const nextPage = page + 1;
      const res = await api.get<PaginatedResponse<Reservation>>('/coaches/me/reservations', {
        params: {
          page: nextPage,
          limit: 10,
          ...(statusFilter && { status: statusFilter }),
        },
      });
      set({
        reservations: [...reservations, ...res.data.list],
        page: nextPage,
        hasNext: res.data.hasNext,
      });
    } catch {
      // silently fail pagination
    }
  },

  fetchForSchedule: async () => {
    set({ isLoadingSchedule: true });
    try {
      const res = await api.get<PaginatedResponse<Reservation>>('/coaches/me/reservations', {
        params: { page: 1, limit: 100, status: ReservationStatus.CONFIRMED },
      });
      set({ allReservations: res.data.list, isLoadingSchedule: false });
    } catch {
      set({ isLoadingSchedule: false });
    }
  },

  fetchReservationById: async (id: number) => {
    set({ isLoadingDetail: true });
    try {
      const res = await api.get<Reservation>(`/reservations/${id}`);
      set({ currentReservation: res.data, isLoadingDetail: false });
    } catch (error: any) {
      set({ isLoadingDetail: false, error: error?.message });
    }
  },

  acceptReservation: async (id: number) => {
    await api.put(`/coaches/me/reservations/${id}/accept`);
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, status: ReservationStatus.CONFIRMED } : r,
      ),
      currentReservation:
        s.currentReservation?.id === id
          ? { ...s.currentReservation, status: ReservationStatus.CONFIRMED }
          : s.currentReservation,
    }));
  },

  rejectReservation: async (id: number) => {
    await api.put(`/coaches/me/reservations/${id}/reject`);
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, status: ReservationStatus.COACH_REJECTED } : r,
      ),
      currentReservation:
        s.currentReservation?.id === id
          ? { ...s.currentReservation, status: ReservationStatus.COACH_REJECTED }
          : s.currentReservation,
    }));
  },

  markAsPaid: async (id: number) => {
    await api.put(`/coaches/me/reservations/${id}/mark-paid`);
    set((s) => ({
      reservations: s.reservations.map((r) =>
        r.id === id ? { ...r, status: ReservationStatus.PAID } : r,
      ),
      currentReservation:
        s.currentReservation?.id === id
          ? { ...s.currentReservation, status: ReservationStatus.PAID }
          : s.currentReservation,
    }));
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status });
  },
}));
