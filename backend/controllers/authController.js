import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Architect } from '../models/index.js';

export async function register(req, res) {
  const { name, email, phone, role, password, CAU } = req.body;
  const password_hash = await bcrypt.hash(password, 10);
  const verification_code = String(Math.floor(100000 + Math.random() * 900000));
  const user = await User.create({ name, email, phone, role, password_hash, verification_code });
  if (role === 'architect') await Architect.create({ user_id: user.id, CAU });
  res.status(201).json({ id: user.id, verification_code });
}

export async function login(req, res) {
  const { email, password, verification_code } = req.body;
  const user = await User.findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ message: 'Credenciais inválidas' });
  if (verification_code !== user.verification_code) return res.status(401).json({ message: 'Código de verificação inválido' });
  const token = jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
}
