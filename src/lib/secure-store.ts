import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ─── Web fallback (localStorage) ─────────────────────────────────────────────
// expo-secure-store ships `export default {}` as its web shim, so every native
// method call throws on web. We gate on Platform.OS instead of using
// `isAvailableAsync()` (which itself crashes on web for the same reason).

function webGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function webSet(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch {}
}
function webRemove(key: string): void {
  try { localStorage.removeItem(key); } catch {}
}

// ─── Universal helpers (use these everywhere instead of SecureStore directly) ─

export async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webGet(key);
  return SecureStore.getItemAsync(key);
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') { webSet(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

export async function storageRemove(key: string): Promise<void> {
  if (Platform.OS === 'web') { webRemove(key); return; }
  await SecureStore.deleteItemAsync(key);
}

// ─── Named token helpers (backwards-compatible with existing callers) ─────────

const ACCESS_TOKEN_KEY = 'sportify_access_token';
const REFRESH_TOKEN_KEY = 'sportify_refresh_token';
const ONBOARDED_KEY = 'sportify_onboarded';

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await storageSet(ACCESS_TOKEN_KEY, accessToken);
  await storageSet(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAccessToken(): Promise<string | null> {
  return storageGet(ACCESS_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return storageGet(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await storageRemove(ACCESS_TOKEN_KEY);
  await storageRemove(REFRESH_TOKEN_KEY);
}

export async function setOnboarded(): Promise<void> {
  await storageSet(ONBOARDED_KEY, 'true');
}

export async function getOnboarded(): Promise<boolean> {
  const val = await storageGet(ONBOARDED_KEY);
  return val === 'true';
}
