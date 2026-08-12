import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'ACTUALIZAR.xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(sheet);

    let updatedCount = 0;
    let createdCount = 0;
    let errors = 0;

    for (const row of data) {
      const sku = String(row['CODIGO'] || "").trim();
      const name = String(row['NOMBRE DEL PRODUCTO'] || "").trim();
      
      if (!sku || !name || sku.startsWith('ESP-')) {
        continue;
      }

      const cost = Number(row['PRECIO DE COMPRA']) || 0;
      const tax = Number(row['IVA']) || 0;
      const profitMargin = Number(row['UTILIDAD']) || 0;
      const volumeDiscount = Number(row['DCT VOLUMEN']) || 0;
      const expertDiscount = Number(row['DCT ALIADO ']) || 0; // Note the trailing space as per headers
      const corporateDiscount = Number(row['DCT CORPORATIVO']) || 0;

      const costWithTax = cost + (cost * tax / 100);
      let u = 1 - (profitMargin / 100);
      if (u <= 0) u = 0.01;

      const finalPrice = costWithTax / u;
      const roundedPrice = Math.ceil(finalPrice / 100) * 100;

      // Infer Category
      const firstWord = name.split(' ')[0].toUpperCase();
      const categoryName = firstWord.length > 2 ? firstWord : "General";

      try {
        const existingProduct = await prisma.product.findFirst({
          where: { sku: sku }
        });

        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              name,
              cost,
              tax,
              profitMargin,
              price: roundedPrice,
              volumeDiscount,
              expertDiscount,
              corporateDiscount
            }
          });
          updatedCount++;
        } else {
          await prisma.product.create({
            data: {
              sku,
              name,
              cost,
              tax,
              profitMargin,
              price: roundedPrice,
              volumeDiscount,
              expertDiscount,
              corporateDiscount,
              stock: 1000,
              unit: "UNIDAD",
              category: {
                connectOrCreate: {
                  where: { name: categoryName },
                  create: { name: categoryName, description: `Categoría ${categoryName}` }
                }
              }
            }
          });
          createdCount++;
        }
      } catch (err) {
        console.error(`Error processing SKU ${sku}:`, err);
        errors++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: data.length,
      updatedCount, 
      createdCount, 
      errors 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
