import { FinancialRecord, OrderItem, Order, Product, Client, Architect, User } from '../models/index.js';
import ExcelJS from 'exceljs';

export async function createFinancialRecord(req, res) {
  const record = await FinancialRecord.create(req.body);
  res.status(201).json(record);
}

export async function exportReport(req, res) {
  const rows = await OrderItem.findAll({
    include: [
      { model: Product, attributes: ['name'] },
      {
        model: Order,
        include: [
          { model: Client, include: [{ model: User, attributes: ['name'] }] },
          { model: Architect, include: [{ model: User, attributes: ['name'] }] }
        ]
      }
    ]
  });
  const data = rows.map((r) => ({
    client: r.order?.client?.user?.name || '',
    architect: r.order?.architect?.user?.name || '',
    product: r.product?.name || '',
    value: Number(r.quantity) * Number(r.product?.price || 0),
    date: r.order?.created_at,
    origin: 'Site',
    status: r.order?.status || ''
  }));

  if (req.query.format === 'csv') {
    const csv = ['client,architect,product,value,date,origin,status', ...data.map((d) => `${d.client},${d.architect},${d.product},${d.value},${d.date},${d.origin},${d.status}`)].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(csv);
  }

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('report');
  ws.columns = [
    { header: 'client', key: 'client' },
    { header: 'architect', key: 'architect' },
    { header: 'product', key: 'product' },
    { header: 'value', key: 'value' },
    { header: 'date', key: 'date' },
    { header: 'origin', key: 'origin' },
    { header: 'status', key: 'status' }
  ];
  ws.addRows(data);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}
