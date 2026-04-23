import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../utils/env.js';

let supabaseClient;

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const url = getEnv('VITE_SUPABASE_URL', { required: true });
  const anonKey = getEnv('VITE_SUPABASE_ANON_KEY', { required: true });

  supabaseClient = createClient(url, anonKey);
  return supabaseClient;
}
