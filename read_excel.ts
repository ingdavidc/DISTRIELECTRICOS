import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });
import * as xlsx from "xlsx";
import * as path from "path";
import { prisma } from "./src/lib/prisma";



const filePath = path.join(process.cwd(), "INVENTARIO.xlsx");
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet);
console.log(`Leídas ${data.length} filas del Excel.`);

let skuCounter = 0;
function generateSKU() {
  skuCounter++;
  return "DE-" + Date.now().toString().slice(-4) + "-" + Math.floor(1000 + Math.random() * 9000).toString() + "-" + skuCounter;
}

async function runImport() {
  console.log("Iniciando proceso de importación y corrección...");
  
  // 1. Obtener categoría por defecto
  let defaultCategory = await prisma.category.findFirst({ where: { name: "General" } });
  if (!defaultCategory) {
    defaultCategory = await prisma.category.findFirst();
  }
  const categoryId = defaultCategory?.id || "default";

  // 2. Corregir productos sin código de barras (SKU) o donde sea vacío
  const productsWithoutSku = await prisma.product.findMany({
    where: { sku: "" }
  });
  
  let fixedSkus = 0;
  for (const prod of productsWithoutSku) {
    await prisma.product.update({
      where: { id: prod.id },
      data: { sku: generateSKU() }
    });
    fixedSkus++;
  }
  console.log(`Se generaron automáticamente códigos de barra para ${fixedSkus} productos existentes.`);

  // 3. Procesar archivo Excel
  let newProducts = 0;
  let updatedProducts = 0;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i] as any;
    const nombre = row["NOMBRE COMERCIAL"];
    
    if (!nombre || typeof nombre !== "string" || nombre.trim() === "") continue;
    
    const nameStr = nombre.trim();
    let costoRaw = row[" Costo de Adquisicion (Sin IVA) "];
    let margenRaw = row["PORCENTAJE DE UTILIDAD ESPERADA"];
    
    let cost = typeof costoRaw === "number" ? costoRaw : 0;
    let profitMargin = typeof margenRaw === "number" ? Math.abs(margenRaw) : 30;
    if (profitMargin > 1000) profitMargin = 30; // Sanity check
    if (profitMargin < 0) profitMargin = Math.abs(profitMargin);
    
    // Si el margen absoluto es 1, a veces en excel es 100% (1.00). Si es > 100, tal vez sea error. 
    // Lo dejamos tal cual o lo ajustamos a 30 por defecto si es loco.
    if (profitMargin === 100) profitMargin = 30; // Asumiremos 30% como un valor más sano si el excel dice 100% negativo por error.
    
    // Calculamos precio (PVP) = costo * (1 + margen/100) * (1 + 19/100)
    let tax = 19;
    let price = cost * (1 + profitMargin / 100) * (1 + tax / 100);
    price = Math.round(price); // Redondear a sin decimales

    // Buscar si existe (ignora mayúsculas/minúsculas)
    const existing = await prisma.product.findFirst({
      where: { 
        name: { equals: nameStr, mode: 'insensitive' }
      }
    });

    if (existing) {
      // Actualizar
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          cost: cost,
          profitMargin: profitMargin,
          price: price,
        }
      });
      updatedProducts++;
    } else {
      // Crear nuevo
      await prisma.product.create({
        data: {
          sku: generateSKU(),
          name: nameStr,
          commercialName: nameStr,
          categoryId: categoryId,
          cost: cost,
          profitMargin: profitMargin,
          tax: tax,
          price: price > 0 ? price : 1000, // Precio mínimo por seguridad si es 0
          stock: 0,
        }
      });
      newProducts++;
    }
    
    if (i % 500 === 0) console.log(`Progreso Excel: ${i} / ${data.length}...`);
  }
  
  console.log(`\nImportación completada:`);
  console.log(`- Productos actualizados: ${updatedProducts}`);
  console.log(`- Productos nuevos creados: ${newProducts}`);
  process.exit(0);
}

runImport().catch(console.error);
