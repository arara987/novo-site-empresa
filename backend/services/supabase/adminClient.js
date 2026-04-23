import { createClient } from '@supabase/supabase-js';
import { getEnv } from '../../utils/env.js';

let adminClient;

export function getSupabaseAdminClient() {
  if (adminClient) return adminClient;

  const url = getEnv('SUPABASE_URL', { required: true });
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY', { required: true });

  adminClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  return adminClient;
}
