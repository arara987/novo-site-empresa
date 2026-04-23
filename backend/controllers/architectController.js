import { Architect, Client, Order } from '../models/index.js';

export async function architectDashboard(req, res) {
  const architect = await Architect.findOne({ where: { user_id: req.user.id } });
  if (!architect?.CAU) return res.status(403).json({ message: 'CAU obrigatório' });
  const [clients, orders] = await Promise.all([
    Client.findAll({ where: { linked_architect_id: architect.id } }),
    Order.findAll({ where: { architect_id: architect.id } })
  ]);
  res.json({ score: architect.score, tier_level: architect.tier_level, clients, orders });
}
