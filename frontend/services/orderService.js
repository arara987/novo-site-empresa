import api from './api';

export async function createOrder(payload) {
  const { data } = await api.post('/orders', payload);
  return data;
}

// TODO: connect order reads/writes directly to Supabase tables.
