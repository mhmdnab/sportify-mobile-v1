import { create } from 'zustand';
import { api } from '../lib/api';
import { Venue, PaginatedResponse, PaginationParams } from '../types/api';

interface VenueSearchParams extends PaginationParams {
  sportId?: number;
  branchId?: number;
  venueTypeId?: number;
  isTop?: boolean;
  isFeatured?: boolean;
}

interface VenuesState {
  venues: Venue[];
  searchResults: Venue[];
  currentVenue: Venue | null;
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  searchPage: number;
  searchHasNext: boolean;

  fetchVenues: (params?: PaginationParams) => Promise<void>;
  searchVenues: (params?: VenueSearchParams) => Promise<void>;
  searchMore: () => Promise<void>;
  fetchVenueById: (id: number) => Promise<void>;
  clearSearch: () => void;
}

let lastSearchParams: VenueSearchParams = {};

export const useVenuesStore = create<VenuesState>((set, get) => ({
  venues: [],
  searchResults: [],
  currentVenue: null,
  isLoading: false,
  isSearching: false,
  error: null,
  searchPage: 1,
  searchHasNext: false,

  fetchVenues: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<PaginatedResponse<Venue>>('/venues', {
        params: { page: 1, limit: 10, ...params },
      });
      set({ venues: response.data.list, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch venues',
      });
    }
  },

  searchVenues: async (params?: VenueSearchParams) => {
    lastSearchParams = params || {};
    set({ isSearching: true, error: null, searchPage: 1 });
    try {
      const response = await api.get<PaginatedResponse<Venue>>('/venues/search', {
        params: { page: 1, limit: 10, ...params },
      });
      set({
        searchResults: response.data.list,
        searchHasNext: response.data.hasNext,
        isSearching: false,
      });
    } catch (error: any) {
      set({
        isSearching: false,
        error: error?.response?.data?.message || 'Failed to search venues',
      });
    }
  },

  searchMore: async () => {
    const { searchHasNext, searchPage, isSearching } = get();
    if (!searchHasNext || isSearching) return;

    set({ isSearching: true });
    try {
      const nextPage = searchPage + 1;
      const response = await api.get<PaginatedResponse<Venue>>('/venues/search', {
        params: { page: nextPage, limit: 10, ...lastSearchParams },
      });
      set((state) => ({
        searchResults: [...state.searchResults, ...response.data.list],
        searchPage: nextPage,
        searchHasNext: response.data.hasNext,
        isSearching: false,
      }));
    } catch {
      set({ isSearching: false });
    }
  },

  fetchVenueById: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Venue>(`/venues/${id}`);
      set({ currentVenue: response.data, isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error?.response?.data?.message || 'Failed to fetch venue',
      });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchPage: 1, searchHasNext: false });
    lastSearchParams = {};
  },
}));
