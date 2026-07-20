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
  
  // Get all products from DB
  const dbProducts = await prisma.product.findMany({
    select: { id: true, name: true }
  });
  
  const idsToDelete: string[] = [];
  
  for (const product of dbProducts) {
    const pName = String(product.name).trim().toLowerCase();
    if (!excelNames.has(pName)) {
      idsToDelete.push(product.id);
    }
  }

  console.log(`Starting deletion of ${idsToDelete.length} products...`);
  
  // Perform deletion in chunks to avoid overwhelming the database
  const chunkSize = 500;
  let deletedCount = 0;

  for (let i = 0; i < idsToDelete.length; i += chunkSize) {
    const chunk = idsToDelete.slice(i, i + chunkSize);
    try {
      // Delete related records first to bypass foreign key constraints
      await prisma.inventoryTransaction.deleteMany({ where: { productId: { in: chunk } } });
      await prisma.orderItem.deleteMany({ where: { productId: { in: chunk } } });
      
      // Try to delete PurchaseOrderItem if it exists in the schema
      try {
        await (prisma as any).purchaseOrderItem?.deleteMany({ where: { productId: { in: chunk } } });
      } catch(e) {}
      
      try {
        await (prisma as any).counterRequest?.deleteMany({ where: { productId: { in: chunk } } });
      } catch(e) {}
      
      const result = await prisma.product.deleteMany({
        where: {
          id: { in: chunk }
        }
      });
      deletedCount += result.count;
      console.log(`Deleted ${deletedCount} / ${idsToDelete.length}...`);
    } catch (e: any) {
      console.error(`Error deleting chunk: ${e.message}`);
    }
  }

  console.log(`Deletion process complete. Total deleted: ${deletedCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
