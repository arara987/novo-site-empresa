import { store, nextId } from './dataStore.js';

export function createOrder({ client_id, architect_id, status = 'pending', items = [] }) {
  for (const item of items) {
    const product = store.products.find((p) => p.id === Number(item.product_id));
    if (!product || Number(product.stock_quantity) < Number(item.quantity)) {
      throw new Error(`Estoque insuficiente: ${item.product_id}`);
    }
  }

  const order = { id: nextId('orders'), client_id, architect_id, status, created_at: new Date().toISOString() };
  store.orders.push(order);

  for (const item of items) {
    const product = store.products.find((p) => p.id === Number(item.product_id));
    product.stock_quantity -= Number(item.quantity);
    store.orderItems.push({ id: nextId('orderItems'), order_id: order.id, product_id: Number(item.product_id), quantity: Number(item.quantity) });
  }

  return order;
}
