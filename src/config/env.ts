// Environment configuration
// In production, these should be loaded from environment variables

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
export const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';

export const ENV = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  API_BASE_URL,
  APP_ENV,
} as const;

export const isDevelopment = APP_ENV === 'development';
export const isProduction = APP_ENV === 'production';
