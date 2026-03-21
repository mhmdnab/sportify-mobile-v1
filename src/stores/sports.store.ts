import { create } from 'zustand';
import { api } from '../lib/api';
import { Sport, PaginatedResponse } from '../types/api';

interface SportsState {
  sports: Sport[];
  isLoading: boolean;
  error: string | null;

  fetchSports: () => Promise<void>;
}

export const useSportsStore = create<SportsState>((set) => ({
  sports: [],
  isLoading: false,
  error: null,

  fetchSports: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<Sport>>('/sports', {
        params: { page: 1, limit: 50 },
      });
      set({ sports: response.data.list, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch sports',
      });
    }
  },
}));
