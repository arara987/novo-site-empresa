import { Equipment, EquipmentHistory, TrainingRecord } from '../models/index.js';

export async function createEquipment(req, res) {
  const equipment = await Equipment.create(req.body);
  await EquipmentHistory.create({ equipment_id: equipment.id, action: 'created', date: new Date(), responsible_id: equipment.responsible_id });
  res.status(201).json(equipment);
}

export async function updateEquipment(req, res) {
  const equipment = await Equipment.findByPk(req.params.id);
  if (!equipment) return res.status(404).json({ message: 'Equipamento não encontrado' });
  await equipment.update(req.body);
  await EquipmentHistory.create({ equipment_id: equipment.id, action: 'updated', date: new Date(), responsible_id: equipment.responsible_id });
  res.json(equipment);
}

export async function recordTraining(req, res) {
  const record = await TrainingRecord.create(req.body);
  res.status(201).json(record);
}
