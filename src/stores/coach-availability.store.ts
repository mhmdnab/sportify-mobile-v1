import { create } from 'zustand';
import { api } from '../lib/api';
import { CoachAvailability, Day } from '../types/api';

interface CreateAvailabilityDto {
  venueId?: number | null;
  day: Day;
  startTime: string;
  endTime: string;
  isActive?: boolean;
}

interface UpdateAvailabilityDto {
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

interface CoachAvailabilityState {
  availabilities: CoachAvailability[];
  isLoading: boolean;
  error: string | null;

  fetchAvailabilities: () => Promise<void>;
  addAvailability: (dto: CreateAvailabilityDto) => Promise<void>;
  updateAvailability: (id: number, dto: UpdateAvailabilityDto) => Promise<void>;
  deleteAvailability: (id: number) => Promise<void>;
}

export const useCoachAvailabilityStore = create<CoachAvailabilityState>((set, get) => ({
  availabilities: [],
  isLoading: false,
  error: null,

  fetchAvailabilities: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<{ data: CoachAvailability[] }>('/coaches/me/availabilities');
      const data = Array.isArray(res.data) ? res.data : (res.data as any).data ?? [];
      set({ availabilities: data, isLoading: false });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load availabilities' });
    }
  },

  addAvailability: async (dto) => {
    const res = await api.post<{ data: CoachAvailability }>('/coaches/me/availabilities', dto);
    const created = (res.data as any).data ?? res.data;
    set((s) => ({ availabilities: [...s.availabilities, created] }));
  },

  updateAvailability: async (id, dto) => {
    const res = await api.put<{ data: CoachAvailability }>(`/coaches/me/availabilities/${id}`, dto);
    const updated = (res.data as any).data ?? res.data;
    set((s) => ({
      availabilities: s.availabilities.map((a) => (a.id === id ? updated : a)),
    }));
  },

  deleteAvailability: async (id) => {
    await api.delete(`/coaches/me/availabilities/${id}`);
    set((s) => ({
      availabilities: s.availabilities.filter((a) => a.id !== id),
    }));
  },
}));
