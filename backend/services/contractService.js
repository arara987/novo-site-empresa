import { store, nextId } from './dataStore.js';

export function createContract(payload) {
  const { payments = [], rtPayments = [], ...contractData } = payload;
  const contract = { id: nextId('contracts'), ...contractData };
  store.contracts.push(contract);

  payments.forEach((p) => {
    store.payments.push({ id: nextId('payments'), contract_id: contract.id, ...p });
  });

  rtPayments.forEach((p) => {
    store.rtPayments.push({ id: nextId('rtPayments'), contract_id: contract.id, ...p });
  });

  return contract;
}
