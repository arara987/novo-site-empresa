import { getDashboard } from '../services/adminService.js';

export async function dashboard(req, res) {
  res.json(getDashboard());
}
