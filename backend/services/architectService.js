import { store } from './dataStore.js';

export function getArchitectDashboard(userId) {
  const architect = store.architects.find((a) => a.user_id === userId);
  if (!architect?.CAU) return null;

  const clients = store.clients.filter((c) => c.linked_architect_id === architect.id);
  const orders = store.orders.filter((o) => o.architect_id === architect.id);

  return { score: architect.score, tier_level: architect.tier_level, clients, orders };
}
