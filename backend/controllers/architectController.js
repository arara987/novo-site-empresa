import { getArchitectDashboard } from '../services/architectService.js';

export async function architectDashboard(req, res) {
  const data = getArchitectDashboard(req.user.id);
  if (!data) return res.status(403).json({ message: 'CAU obrigatório' });
  return res.json(data);
}
