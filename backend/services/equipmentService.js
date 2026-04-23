import { store, nextId } from './dataStore.js';

export function createEquipment(payload) {
  const equipment = { id: nextId('equipments'), status: 'available', ...payload };
  store.equipments.push(equipment);
  store.equipmentHistory.push({ id: nextId('equipmentHistory'), equipment_id: equipment.id, action: 'created', date: new Date().toISOString(), responsible_id: equipment.responsible_id || null });
  return equipment;
}

export function updateEquipment(id, payload) {
  const equipment = store.equipments.find((e) => e.id === Number(id));
  if (!equipment) return null;
  Object.assign(equipment, payload);
  store.equipmentHistory.push({ id: nextId('equipmentHistory'), equipment_id: equipment.id, action: 'updated', date: new Date().toISOString(), responsible_id: equipment.responsible_id || null });
  return equipment;
}
