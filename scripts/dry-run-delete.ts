import { prisma } from '../src/lib/prisma';
import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';

async function main() {
  const filePath = path.join(process.cwd(), 'INVENTARIO.xlsx');
  
  if (!fs.existsSync(filePath)) {
    console.log("File INVENTARIO.xlsx not found at:", filePath);
    process.exit(1);
  }

  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(sheet);
  
  // Extract names from Excel
  const excelNames = new Set(data.map((row: any) => {
    const name = row['NOMBRE COMERCIAL'] || row['NOMBRE'] || row['Nombre'] || row['name'];
    return name ? String(name).trim().toLowerCase() : null;
  }).filter(Boolean));
  
  console.log(`Total valid names in Excel: ${excelNames.size}`);

  // Get all products from DB
  const dbProducts = await prisma.product.findMany({
    select: { id: true, name: true, sku: true, commercialName: true }
  });
  
  console.log(`Total products in DB: ${dbProducts.length}`);

  let matchCount = 0;
  let noMatchCount = 0;
  
  for (const product of dbProducts) {
    const pName = String(product.name).trim().toLowerCase();
    if (excelNames.has(pName)) {
      matchCount++;
    } else {
      noMatchCount++;
    }
  }

  console.log(`Products in DB that MATCH Excel: ${matchCount}`);
  console.log(`Products in DB that DO NOT match Excel (to be deleted): ${noMatchCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
