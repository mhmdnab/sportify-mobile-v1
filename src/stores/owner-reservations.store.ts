import { create } from 'zustand';
import { api } from '../lib/api';
import { Reservation, ReservationStatus, PaginatedResponse } from '../types/api';

interface OwnerReservationsState {
  reservations: Reservation[];
  allReservations: Reservation[];
  currentReservation: Reservation | null;
  groupReservations: Reservation[];
  isLoading: boolean;
  isLoadingDetail: boolean;
  isLoadingSchedule: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;
  total: number;

  fetchOwnerReservations: (refresh?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchForSchedule: () => Promise<void>;
  fetchReservationById: (id: number) => Promise<void>;
  fetchGroupReservations: (groupId: string) => Promise<void>;
  updateReservationStatus: (id: number, status: ReservationStatus) => Promise<void>;
}

export const useOwnerReservationsStore = create<OwnerReservationsState>((set, get) => ({
  reservations: [],
  allReservations: [],
  currentReservation: null,
  groupReservations: [],
  isLoading: false,
  isLoadingDetail: false,
  isLoadingSchedule: false,
  error: null,
  page: 1,
  hasNext: false,
  total: 0,

  fetchOwnerReservations: async (refresh = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<PaginatedResponse<Reservation>>('/reservations/owner/all', {
        params: { page: 1, limit: 10 },
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
    const { hasNext, page, reservations } = get();
    if (!hasNext) return;
    try {
      const nextPage = page + 1;
      const res = await api.get<PaginatedResponse<Reservation>>('/reservations/owner/all', {
        params: { page: nextPage, limit: 10 },
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
      const res = await api.get<PaginatedResponse<Reservation>>('/reservations/owner/all', {
        params: { page: 1, limit: 100 },
      });
      set({ allReservations: res.data.list, isLoadingSchedule: false });
    } catch (error: any) {
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

  fetchGroupReservations: async (groupId: string) => {
    set({ isLoadingDetail: true });
    try {
      const res = await api.get<Reservation[]>(`/reservations/group/${groupId}`);
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.data ?? [];
      set({ groupReservations: list, isLoadingDetail: false });
    } catch (error: any) {
      set({ isLoadingDetail: false, error: error?.message });
    }
  },

  updateReservationStatus: async (id: number, status: ReservationStatus) => {
    try {
      await api.put(`/reservations/${id}`, { status });
      set((s) => ({
        reservations: s.reservations.map((r) =>
          r.id === id ? { ...r, status } : r
        ),
        allReservations: s.allReservations.map((r) =>
          r.id === id ? { ...r, status } : r
        ),
        currentReservation:
          s.currentReservation?.id === id
            ? { ...s.currentReservation, status }
            : s.currentReservation,
      }));
    } catch (error: any) {
      throw error;
    }
  },
}));
