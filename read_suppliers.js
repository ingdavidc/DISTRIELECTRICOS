const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'PROVEEDORES REALES.xlsx');
const workbook = xlsx.readFile(filePath);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
console.log('Total rows:', data.length);

if (data.length > 0) {
  // Let's print the first 5 rows to understand where the headers actually are
  for (let i = 0; i < Math.min(5, data.length); i++) {
    console.log(`Row ${i}:`, data[i]);
  }
}
