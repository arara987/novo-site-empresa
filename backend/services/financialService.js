import { store, nextId } from './dataStore.js';

export function createFinancialRecord(payload) {
  const record = { id: nextId('financialRecords'), date: new Date().toISOString(), ...payload };
  store.financialRecords.push(record);
  return record;
}

export function getFinancialRowsForExport() {
  return store.orderItems.map((item) => {
    const order = store.orders.find((o) => o.id === item.order_id);
    const product = store.products.find((p) => p.id === item.product_id);
    const client = store.clients.find((c) => c.id === order?.client_id);
    const architect = store.architects.find((a) => a.id === order?.architect_id);
    const clientUser = store.users.find((u) => u.id === client?.user_id);
    const architectUser = store.users.find((u) => u.id === architect?.user_id);

    return {
      client: clientUser?.name || '',
      architect: architectUser?.name || '',
      product: product?.name || '',
      value: Number(item.quantity) * Number(product?.price || 0),
      date: order?.created_at || '',
      origin: 'Site',
      status: order?.status || ''
    };
  });
}
