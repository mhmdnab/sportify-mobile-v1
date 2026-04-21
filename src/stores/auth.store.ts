import { create } from 'zustand';
import { api } from '../lib/api';
import { setTokens, clearTokens, getAccessToken, setOnboarded, getOnboarded } from '../lib/secure-store';
import { User } from '../types/api';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  isHydrated: boolean;

  login: (data: LoginRequest) => Promise<void>;
  googleLogin: (accessToken: string) => Promise<void>;
  appleLogin: (identityToken: string, fullName?: string | null) => Promise<void>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hydrate: () => Promise<void>;
  markOnboarded: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isOnboarded: false,
  isHydrated: false,

  appleLogin: async (identityToken: string, fullName?: string | null) => {
    set({ isLoading: true });
    try {
      const response = await api.post<AuthResponse>('/users/signin/apple-mobile', { identityToken, fullName });
      const { accessToken, refreshToken, ...user } = response.data;
      await setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  googleLogin: async (accessToken: string) => {
    set({ isLoading: true });
    try {
      const response = await api.post<AuthResponse>('/users/signin/google-mobile', { accessToken });
      const { accessToken: appAccessToken, refreshToken, ...user } = response.data;
      await setTokens(appAccessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  login: async (data: LoginRequest) => {
    set({ isLoading: true });
    try {
      const response = await api.post<AuthResponse>('/users/signin', data);
      const { accessToken, refreshToken, ...user } = response.data;
      await setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      const response = await api.post<AuthResponse>('/users', data);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  refreshProfile: async () => {
    try {
      const response = await api.get<User>('/users/profile');
      set({ user: response.data });
    } catch {
      // silently fail
    }
  },

  hydrate: async () => {
    try {
      const onboarded = await getOnboarded();
      const token = await getAccessToken();

      if (!token) {
        set({ isHydrated: true, isOnboarded: onboarded });
        return;
      }

      const response = await api.get<User>('/users/profile');
      set({
        user: response.data,
        isAuthenticated: true,
        isOnboarded: onboarded,
        isHydrated: true,
      });
    } catch {
      await clearTokens();
      const onboarded = await getOnboarded();
      set({ isHydrated: true, isOnboarded: onboarded });
    }
  },

  markOnboarded: async () => {
    await setOnboarded();
    set({ isOnboarded: true });
  },
}));
