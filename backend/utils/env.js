export function getEnv(name, { required = false, fallback } = {}) {
  const value = process.env[name] ?? fallback;
  if (required && (value === undefined || value === '')) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getBackendConfig() {
  return {
    port: Number(getEnv('PORT', { fallback: 4000 })),
    jwtSecret: getEnv('JWT_SECRET', { fallback: 'dev-secret' }),
    supabaseUrl: getEnv('SUPABASE_URL'),
    supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY')
  };
}
