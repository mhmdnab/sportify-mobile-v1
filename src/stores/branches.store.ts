import { create } from 'zustand';
import { api } from '../lib/api';
import { Branch, PaginatedResponse, PaginationParams } from '../types/api';

interface BranchesState {
  branches: Branch[];
  featuredBranches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasNext: boolean;

  fetchBranches: (params?: PaginationParams) => Promise<void>;
  fetchMoreBranches: () => Promise<void>;
  fetchFeaturedBranches: () => Promise<void>;
  fetchBranchById: (id: number) => Promise<void>;
  reset: () => void;
}

export const useBranchesStore = create<BranchesState>((set, get) => ({
  branches: [],
  featuredBranches: [],
  currentBranch: null,
  isLoading: false,
  error: null,
  page: 1,
  hasNext: false,

  fetchBranches: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null, page: 1 });
    try {
      const response = await api.get<PaginatedResponse<Branch>>('/branches', {
        params: { page: 1, limit: 10, ...params },
      });
      set({
        branches: response.data.list,
        hasNext: response.data.hasNext,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch branches',
      });
    }
  },

  fetchMoreBranches: async () => {
    const { hasNext, page, isLoading } = get();
    if (!hasNext || isLoading) return;

    set({ isLoading: true });
    try {
      const nextPage = page + 1;
      const response = await api.get<PaginatedResponse<Branch>>('/branches', {
        params: { page: nextPage, limit: 10 },
      });
      set((state) => ({
        branches: [...state.branches, ...response.data.list],
        page: nextPage,
        hasNext: response.data.hasNext,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ isLoading: false });
    }
  },

  fetchFeaturedBranches: async () => {
    try {
      const response = await api.get<PaginatedResponse<Branch>>('/branches', {
        params: { page: 1, limit: 10, column: 'isFeatured', order: 'desc' },
      });
      set({ featuredBranches: response.data.list });
    } catch {
      // silently fail
    }
  },

  fetchBranchById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Branch>(`/branches/${id}`);
      set({ currentBranch: response.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch branch',
      });
    }
  },

  reset: () => set({ branches: [], page: 1, hasNext: false }),
}));
