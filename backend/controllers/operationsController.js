import { createEquipment, updateEquipment } from '../services/equipmentService.js';
import { recordTraining } from '../services/trainingService.js';

export async function createEquipmentHandler(req, res) {
  const equipment = createEquipment(req.body);
  res.status(201).json(equipment);
}

export async function updateEquipmentHandler(req, res) {
  const equipment = updateEquipment(req.params.id, req.body);
  if (!equipment) return res.status(404).json({ message: 'Equipamento não encontrado' });
  return res.json(equipment);
}

export async function recordTrainingHandler(req, res) {
  const record = recordTraining(req.body);
  res.status(201).json(record);
}
