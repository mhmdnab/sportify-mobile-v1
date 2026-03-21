import { create } from 'zustand';
import { api } from '../lib/api';
import { Reservation, PaginatedResponse } from '../types/api';

interface CreateReservationData {
  slotId: number;
  slotDate: string;
  repeatCount?: number;
  notes?: string;
}

interface ReservationsState {
  reservations: Reservation[];
  currentReservation: Reservation | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;

  fetchOwnReservations: (params?: { page?: number; limit?: number }) => Promise<void>;
  fetchMoreReservations: () => Promise<void>;
  fetchReservationById: (id: number) => Promise<void>;
  createReservation: (data: CreateReservationData) => Promise<Reservation>;
  cancelReservation: (id: number) => Promise<void>;
  reset: () => void;
}

export const useReservationsStore = create<ReservationsState>((set, get) => ({
  reservations: [],
  currentReservation: null,
  isLoading: false,
  error: null,
  page: 1,
  hasNext: false,

  fetchOwnReservations: async (params) => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const response = await api.get<PaginatedResponse<Reservation>>('/reservations/own', {
        params: { page: 1, limit: 20, ...params },
      });
      set({
        reservations: response.data.list,
        hasNext: response.data.hasNext,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch reservations',
      });
    }
  },

  fetchMoreReservations: async () => {
    const { hasNext, page, isLoading } = get();
    if (!hasNext || isLoading) return;

    set({ isLoading: true });
    try {
      const nextPage = page + 1;
      const response = await api.get<PaginatedResponse<Reservation>>('/reservations/own', {
        params: { page: nextPage, limit: 20 },
      });
      set((state) => ({
        reservations: [...state.reservations, ...response.data.list],
        page: nextPage,
        hasNext: response.data.hasNext,
        isLoading: false,
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  fetchReservationById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Reservation>(`/reservations/${id}`);
      set({ currentReservation: response.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch reservation',
      });
    }
  },

  createReservation: async (data: CreateReservationData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<Reservation>('/reservations', data);
      set({ isLoading: false });
      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to create reservation',
      });
      throw error;
    }
  },

  cancelReservation: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.put(`/reservations/${id}`, { status: 'CANCELLED' });
      set((state) => ({
        reservations: state.reservations.map((r) =>
          r.id === id ? { ...r, status: 'CANCELLED' as any } : r,
        ),
        currentReservation:
          state.currentReservation?.id === id
            ? { ...state.currentReservation, status: 'CANCELLED' as any }
            : state.currentReservation,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to cancel reservation',
      });
      throw error;
    }
  },

  reset: () => set({ reservations: [], page: 1, hasNext: false }),
}));
