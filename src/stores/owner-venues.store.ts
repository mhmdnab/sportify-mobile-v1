import { create } from 'zustand';
import { api } from '../lib/api';
import { Venue, Day, PaginatedResponse } from '../types/api';

interface AvailabilityUpdate {
  day: Day;
  startTime: string;
  endTime: string;
  isOpen: boolean;
}

interface OwnerVenuesState {
  venues: Venue[];
  currentVenue: Venue | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  isSavingAvailability: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;
  total: number;

  fetchOwnVenues: (refresh?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchVenueById: (id: number) => Promise<void>;
  deleteVenue: (id: number) => Promise<void>;
  updateAvailability: (venueId: number, availability: AvailabilityUpdate[]) => Promise<void>;
}

export const useOwnerVenuesStore = create<OwnerVenuesState>((set, get) => ({
  venues: [],
  currentVenue: null,
  isLoading: false,
  isLoadingDetail: false,
  isSavingAvailability: false,
  error: null,
  page: 1,
  hasNext: false,
  total: 0,

  fetchOwnVenues: async (refresh = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<PaginatedResponse<Venue>>('/venues/own', {
        params: { page: 1, limit: 10 },
      });
      set({
        venues: res.data.list,
        page: 1,
        hasNext: res.data.hasNext,
        total: res.data.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load venues' });
    }
  },

  fetchMore: async () => {
    const { hasNext, page, venues } = get();
    if (!hasNext) return;
    try {
      const nextPage = page + 1;
      const res = await api.get<PaginatedResponse<Venue>>('/venues/own', {
        params: { page: nextPage, limit: 10 },
      });
      set({
        venues: [...venues, ...res.data.list],
        page: nextPage,
        hasNext: res.data.hasNext,
      });
    } catch {
      // silently fail pagination
    }
  },

  fetchVenueById: async (id: number) => {
    set({ isLoadingDetail: true });
    try {
      const res = await api.get<Venue>(`/venues/${id}`);
      set({ currentVenue: res.data, isLoadingDetail: false });
    } catch (error: any) {
      set({ isLoadingDetail: false, error: error?.message });
    }
  },

  deleteVenue: async (id: number) => {
    try {
      await api.put(`/venues/${id}/delete`);
      set((s) => ({ venues: s.venues.filter((v) => v.id !== id) }));
    } catch (error: any) {
      throw error;
    }
  },

  updateAvailability: async (venueId: number, availability: AvailabilityUpdate[]) => {
    set({ isSavingAvailability: true });
    try {
      await api.put(`/venues/${venueId}`, { availability });
      // Refresh the current venue to get updated data
      const res = await api.get<Venue>(`/venues/${venueId}`);
      set({ currentVenue: res.data, isSavingAvailability: false });
    } catch (error: any) {
      set({ isSavingAvailability: false });
      throw error;
    }
  },
}));
