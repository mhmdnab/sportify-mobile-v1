import { create } from 'zustand';
import { api } from '../lib/api';

export interface ClientStat {
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  totalReservations: number;
  totalCancellations: number;
  totalPaid: number;
  totalRevenue: number;
}

interface ManagerClientsState {
  clients: ClientStat[];
  total: number;
  page: number;
  hasNext: boolean;
  search: string;
  isLoading: boolean;
  error: string | null;

  fetchClients: (refresh?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  setSearch: (search: string) => void;
}

export const useManagerClientsStore = create<ManagerClientsState>((set, get) => ({
  clients: [],
  total: 0,
  page: 1,
  hasNext: false,
  search: '',
  isLoading: false,
  error: null,

  fetchClients: async (refresh = true) => {
    const { search } = get();
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<{ data: ClientStat[]; total: number; page: number; limit: number }>(
        '/reservations/manager/clients',
        { params: { page: 1, limit: 20, ...(search ? { search } : {}) } },
      );
      set({
        clients: res.data.data,
        total: res.data.total,
        page: 1,
        hasNext: res.data.data.length < res.data.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load clients' });
    }
  },

  fetchMore: async () => {
    const { hasNext, page, clients, search } = get();
    if (!hasNext) return;
    try {
      const nextPage = page + 1;
      const res = await api.get<{ data: ClientStat[]; total: number; page: number; limit: number }>(
        '/reservations/manager/clients',
        { params: { page: nextPage, limit: 20, ...(search ? { search } : {}) } },
      );
      const merged = [...clients, ...res.data.data];
      set({
        clients: merged,
        page: nextPage,
        hasNext: merged.length < res.data.total,
      });
    } catch {
      // silently fail
    }
  },

  setSearch: (search: string) => {
    set({ search });
  },
}));
