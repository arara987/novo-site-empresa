import ExcelJS from 'exceljs';
import { createFinancialRecord, getFinancialRowsForExport } from '../services/financialService.js';

export async function createFinancialRecordHandler(req, res) {
  const record = createFinancialRecord(req.body);
  res.status(201).json(record);
}

export async function exportReport(req, res) {
  const data = getFinancialRowsForExport();

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
