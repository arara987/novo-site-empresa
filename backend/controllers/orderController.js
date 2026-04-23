import { Order, OrderItem, Product } from '../models/index.js';

export async function createOrder(req, res) {
  const { client_id, architect_id, status = 'pending', items = [] } = req.body;
  const order = await Order.create({ client_id, architect_id, status });
  for (const item of items) {
    const product = await Product.findByPk(item.product_id);
    if (!product || product.stock_quantity < item.quantity) return res.status(400).json({ message: `Estoque insuficiente: ${item.product_id}` });
    await OrderItem.create({ order_id: order.id, product_id: item.product_id, quantity: item.quantity });
    product.stock_quantity -= item.quantity;
    await product.save();
  }
  if (req.logActivity) await req.logActivity({ orderId: order.id });
  res.status(201).json(order);
}
