import { prisma } from '../src/lib/prisma';
import * as xlsx from 'xlsx';
import * as path from 'path';

async function main() {
  console.log('Iniciando proceso de importación de proveedores...');
  
  const filePath = path.join(process.cwd(), 'PROVEEDORES REALES.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
  console.log(`Total de filas leídas: ${data.length}`);

  if (data.length <= 3) {
    console.log('No hay suficientes datos para importar.');
    return;
  }

  // Row 3 (index 2) is headers, we start from Row 4 (index 3)
  const cleanData: any[] = [];
  
  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const nombre = String(row[2] || '').trim();
    if (!nombre) continue;
    
    let rawNit = String(row[3] || '').trim();
    let cleanNit = rawNit;

    // Clean NIT format: "NIT 805011074 2" -> "805011074-2"
    if (rawNit) {
      // Remove "NIT " and other non-alphanumeric except spaces
      let numbersOnly = rawNit.replace(/[^0-9\s]/g, '').trim();
      
      // If it ends with a space and a single digit (the verification digit), replace the space with a dash
      if (/[0-9]+\s[0-9]$/.test(numbersOnly)) {
        cleanNit = numbersOnly.replace(/\s([0-9])$/, '-$1');
      } else {
        // Just remove all spaces if it doesn't match the pattern
        cleanNit = numbersOnly.replace(/\s/g, '');
      }
    }
    
    let categoria = String(row[0] || row[1] || '').trim();
    
    cleanData.push({
      name: nombre,
      nit: cleanNit,
      category: categoria,
      contactName: 'Auto-importado', // Placeholder since it's empty
    });
  }

  console.log(`Proveedores válidos extraídos: ${cleanData.length}`);

  console.log('Importando proveedores a la base de datos...');
  let successCount = 0;
  let errorCount = 0;

  for (const item of cleanData) {
    try {
      // Use findFirst since nit is not unique
      let existingSupplier = null;
      
      if (item.nit) {
        existingSupplier = await prisma.supplier.findFirst({
          where: { nit: item.nit }
        });
      }
      
      if (!existingSupplier) {
        existingSupplier = await prisma.supplier.findFirst({
          where: { name: item.name }
        });
      }

      if (existingSupplier) {
        // Update existing
        await prisma.supplier.update({
          where: { id: existingSupplier.id },
          data: {
            nit: item.nit || existingSupplier.nit,
            category: item.category || existingSupplier.category,
          }
        });
      } else {
        // Create new
        await prisma.supplier.create({
          data: {
            name: item.name,
            nit: item.nit,
            category: item.category,
            contactName: item.contactName,
            paymentTerms: "CONTADO",
            status: "ACTIVE"
          }
        });
      }
      
      successCount++;
    } catch (err: any) {
      // console.error(`Error procesando proveedor ${item.name}: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`Importación finalizada. Éxitos: ${successCount}, Errores: ${errorCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
