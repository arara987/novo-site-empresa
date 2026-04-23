import { Contract, Payment, RtPayment } from '../models/index.js';

export async function createContract(req, res) {
  const { payments = [], rtPayments = [], ...contractData } = req.body;
  const contract = await Contract.create(contractData);
  await Promise.all(payments.map((p) => Payment.create({ ...p, contract_id: contract.id })));
  await Promise.all(rtPayments.map((p) => RtPayment.create({ ...p, contract_id: contract.id })));
  if (req.logActivity) await req.logActivity({ contractId: contract.id });
  res.status(201).json(contract);
}
