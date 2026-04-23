import { createContract } from '../services/contractService.js';

export async function createContractHandler(req, res) {
  const contract = createContract(req.body);
  if (req.logActivity) await req.logActivity({ contractId: contract.id });
  res.status(201).json(contract);
}
