import { createClient } from '@supabase/supabase-js';
import { ENV } from '../../config/env';

export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database table names
export const TABLES = {
  USERS: 'users',
  CLIENTS: 'clients',
  LOANS: 'loans',
  PAYMENTS: 'payments',
  MONTHLY_PAYMENTS: 'monthly_payments',
} as const;
