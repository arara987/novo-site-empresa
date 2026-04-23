import { store, nextId } from './dataStore.js';

export function recordTraining(payload) {
  const record = { id: nextId('trainingRecords'), date: new Date().toISOString(), status: 'pending', ...payload };
  store.trainingRecords.push(record);
  return record;
}
