import { Client, Architect, FinancialRecord, Product, Order, ActivityLog, User } from '../models/index.js';

export async function dashboard(req, res) {
  const [salesCount, clients, architects, finance, lowStock, logs] = await Promise.all([
    Order.count(),
    Client.count(),
    Architect.findAll({ order: [['score', 'DESC']], limit: 10 }),
    FinancialRecord.findAll({ order: [['date', 'DESC']], limit: 20 }),
    Product.findAll({ where: { stock_quantity: 0 }, limit: 20 }),
    ActivityLog.findAll({ include: [{ model: User, attributes: ['name', 'email'] }], order: [['createdAt', 'DESC']], limit: 30 })
  ]);

  res.json({ salesCount, clients, architects, finance, lowStock, logs });
}
