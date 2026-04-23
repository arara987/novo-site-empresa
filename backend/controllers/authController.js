import { loginUser, registerUser } from '../services/authService.js';

export async function register(req, res) {
  try {
    const data = await registerUser(req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export async function login(req, res) {
  try {
    const data = await loginUser(req.body);
    res.json(data);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
}
