import { createOrder } from '../services/orderService.js';

export async function createOrderHandler(req, res) {
  try {
    const order = createOrder(req.body);
    if (req.logActivity) await req.logActivity({ orderId: order.id });
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}
