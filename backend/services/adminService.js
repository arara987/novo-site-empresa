import { appendLog, store } from './dataStore.js';

export function registerActivity({ userId, module, action, payload = {} }) {
  return appendLog({ user_id: userId, module, action, payload });
}

export function getDashboard() {
  const architects = [...store.architects]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .slice(0, 10);

  const finance = [...store.financialRecords].reverse().slice(0, 20);
  const lowStock = store.products.filter((p) => Number(p.stock_quantity) === 0).slice(0, 20);
  const logs = store.activityLogs.slice(0, 30).map((log) => {
    const user = store.users.find((u) => u.id === log.user_id);
    return { ...log, user: user ? { name: user.name, email: user.email } : null };
  });

  return {
    salesCount: store.orders.length,
    clients: store.clients.length,
    architects,
    finance,
    lowStock,
    logs
  };
}
