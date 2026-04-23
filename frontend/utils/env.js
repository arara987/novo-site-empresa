function getEnv(name, { required = false, fallback } = {}) {
  const value = import.meta.env[name] ?? fallback;
  if (required && (value === undefined || value === '')) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  apiUrl: getEnv('VITE_API_URL', { fallback: 'http://localhost:4000/api' }),
  supabaseUrl: getEnv('VITE_SUPABASE_URL'),
  supabaseAnonKey: getEnv('VITE_SUPABASE_ANON_KEY')
};

export { getEnv };
