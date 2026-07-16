import { prisma } from '../src/lib/prisma';
import * as xlsx from 'xlsx';
import * as path from 'path';

async function main() {
  console.log('Iniciando proceso de importación...');
  
  const filePath = path.join(process.cwd(), 'INVENTARIO REAL.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });
  console.log(`Total de filas leídas: ${data.length}`);

  if (data.length <= 1) {
    console.log('No hay datos para importar.');
    return;
  }

  // Row 1 is headers, we start from Row 2
  const cleanData: any[] = [];
  const uniqueCategories = new Set<string>();
  
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    const codigo = String(row[4] || '').trim();
    if (!codigo) continue;
    
    let categoria = String(row[0] || '').trim();
    if (!categoria || categoria.toLowerCase() === 'undefined' || categoria.toLowerCase() === 'null') {
      categoria = 'Sin Categoría';
    }
    
    uniqueCategories.add(categoria);
    
    cleanData.push({
      grupoUno: categoria,
      codigoProducto: codigo,
      descripcion: String(row[5] || '').trim(),
      maximoPermitido: row[6] ? parseInt(row[6]) || 0 : 0,
      minimoPermitido: row[7] ? parseInt(row[7]) || 0 : 0,
      unidadMedida: String(row[9] || 'Und.').trim(),
      precio1: row[10] ? parseFloat(row[10]) || 0 : 0,
      iva: row[14] ? parseFloat(row[14]) || 0 : 0,
      existencias: row[15] ? parseInt(row[15]) || 0 : 0,
    });
  }

  console.log(`Filas válidas extraídas: ${cleanData.length}`);
  console.log(`Categorías únicas encontradas: ${uniqueCategories.size}`);

  // 1. Insert Categories
  console.log('Importando categorías...');
  const categoryMap = new Map<string, string>(); // name -> id
  
  for (const catName of Array.from(uniqueCategories)) {
    const cat = await prisma.category.upsert({
      where: { name: catName },
      update: {},
      create: { name: catName },
    });
    categoryMap.set(catName, cat.id);
  }
  console.log('Categorías importadas correctamente.');

  // 2. Insert Products in batches
  console.log('Importando productos...');
  const batchSize = 100;
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < cleanData.length; i += batchSize) {
    const batch = cleanData.slice(i, i + batchSize);
    
    // Process batch sequentially to avoid overwhelming connection pool and handle individual upsert
    // Since we need to update stock/price or insert if it doesn't exist
    for (const item of batch) {
      try {
        const categoryId = categoryMap.get(item.grupoUno);
        if (!categoryId) {
          throw new Error(`Category not found: ${item.grupoUno}`);
        }

        await prisma.product.upsert({
          where: { sku: item.codigoProducto },
          update: {
            name: item.descripcion,
            unit: item.unidadMedida,
            price: item.precio1,
            tax: item.iva,
            stock: item.existencias,
            minStockLimit: item.minimoPermitido,
            maxStockLimit: item.maximoPermitido,
            categoryId: categoryId,
            // Cost is kept 0 as requested, or not updated if already exists
          },
          create: {
            sku: item.codigoProducto,
            name: item.descripcion,
            unit: item.unidadMedida,
            price: item.precio1,
            tax: item.iva,
            stock: item.existencias,
            minStockLimit: item.minimoPermitido,
            maxStockLimit: item.maximoPermitido,
            cost: 0, 
            categoryId: categoryId,
          }
        });
        successCount++;
      } catch (err: any) {
        // console.error(`Error procesando SKU ${item.codigoProducto}: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`Procesados ${i + batch.length} de ${cleanData.length}...`);
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
