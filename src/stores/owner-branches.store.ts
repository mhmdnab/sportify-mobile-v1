import { create } from 'zustand';
import { api } from '../lib/api';
import { Branch, PaginatedResponse } from '../types/api';

interface OwnerBranchesState {
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  isLoadingDetail: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;
  total: number;

  fetchOwnBranches: (refresh?: boolean) => Promise<void>;
  fetchMore: () => Promise<void>;
  fetchBranchById: (id: number) => Promise<void>;
  deleteBranch: (id: number) => Promise<void>;
}

export const useOwnerBranchesStore = create<OwnerBranchesState>((set, get) => ({
  branches: [],
  currentBranch: null,
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  page: 1,
  hasNext: false,
  total: 0,

  fetchOwnBranches: async (refresh = true) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<PaginatedResponse<Branch>>('/branches/own', {
        params: { page: 1, limit: 10 },
      });
      set({
        branches: res.data.list,
        page: 1,
        hasNext: res.data.hasNext,
        total: res.data.total,
        isLoading: false,
      });
    } catch (error: any) {
      set({ isLoading: false, error: error?.message || 'Failed to load branches' });
    }
  },

  fetchMore: async () => {
    const { hasNext, page, branches } = get();
    if (!hasNext) return;
    try {
      const nextPage = page + 1;
      const res = await api.get<PaginatedResponse<Branch>>('/branches/own', {
        params: { page: nextPage, limit: 10 },
      });
      set({
        branches: [...branches, ...res.data.list],
        page: nextPage,
        hasNext: res.data.hasNext,
      });
    } catch {
      // silently fail pagination
    }
  },

  fetchBranchById: async (id: number) => {
    set({ isLoadingDetail: true });
    try {
      const res = await api.get<Branch>(`/branches/${id}`);
      set({ currentBranch: res.data, isLoadingDetail: false });
    } catch (error: any) {
      set({ isLoadingDetail: false, error: error?.message });
    }
  },

  deleteBranch: async (id: number) => {
    try {
      await api.put(`/branches/${id}/delete`);
      set((s) => ({ branches: s.branches.filter((b) => b.id !== id) }));
    } catch (error: any) {
      throw error;
    }
  },
}));
