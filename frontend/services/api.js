import axios from 'axios';
import { env } from '../utils/env';

const api = axios.create({ baseURL: env.apiUrl });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
