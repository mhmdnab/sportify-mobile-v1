import { Address, User } from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  phoneCountryCode?: string;
  image?: string;
  gender?: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  address?: Omit<Address, 'id'>;
}

export interface AuthResponse extends User {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresIn: number;
}
