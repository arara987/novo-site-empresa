const now = () => new Date().toISOString();

export const store = {
  users: [],
  architects: [],
  clients: [],
  products: [
    { id: 1, name: 'Porcelanato Calacata', code: 'PORC-001', category: 'Revestimento', price: 229.9, description: 'Linha premium para áreas internas.', stock_quantity: 20 },
    { id: 2, name: 'Torneira Gourmet Inox', code: 'TORN-002', category: 'Metais', price: 849.5, description: 'Design para cozinhas sofisticadas.', stock_quantity: 8 }
  ],
  orders: [],
  orderItems: [],
  contracts: [],
  payments: [],
  rtPayments: [],
  financialRecords: [],
  equipments: [],
  equipmentHistory: [],
  trainingRecords: [],
  activityLogs: []
};

const counters = new Map();
export function nextId(key) {
  const current = counters.get(key) || 0;
  const next = current + 1;
  counters.set(key, next);
  return next;
}

export function appendLog(entry) {
  const log = { id: nextId('activityLogs'), createdAt: now(), ...entry };
  store.activityLogs.unshift(log);
  return log;
}
