import api from './api';

export async function login(form) {
  const { data } = await api.post('/auth/login', form);
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

// TODO: replace with Supabase Auth flows when project migration starts.
