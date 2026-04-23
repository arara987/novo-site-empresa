import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { store, nextId } from './dataStore.js';
import { getBackendConfig } from '../utils/env.js';

const { jwtSecret } = getBackendConfig();

export async function registerUser(payload) {
  const { name, email, phone, role, password, CAU } = payload;
  if (store.users.some((u) => u.email === email)) {
    throw new Error('E-mail já cadastrado');
  }

  const password_hash = await bcrypt.hash(password, 10);
  const verification_code = String(Math.floor(100000 + Math.random() * 900000));
  const user = { id: nextId('users'), name, email, phone, role, password_hash, verification_code };
  store.users.push(user);

  if (role === 'architect') {
    store.architects.push({ id: nextId('architects'), user_id: user.id, CAU, tier_level: 1, score: 0 });
  }

  if (role === 'client') {
    store.clients.push({ id: nextId('clients'), user_id: user.id, linked_architect_id: null, created_at: new Date().toISOString() });
  }

  return { id: user.id, verification_code };
}

export async function loginUser({ email, password, verification_code }) {
  const user = store.users.find((u) => u.email === email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) throw new Error('Credenciais inválidas');
  if (verification_code !== user.verification_code) throw new Error('Código de verificação inválido');

  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, jwtSecret, { expiresIn: '8h' });
  return { token, user: { id: user.id, name: user.name, role: user.role } };
}
