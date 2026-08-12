import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const products = await prisma.product.findMany();
    let updatedCount = 0;

    for (const product of products) {
      const cost = product.cost || 0;
      const margin = product.profitMargin || 0;
      const tax = product.tax || 0;

      const costWithTax = cost + (cost * tax / 100);
      let u = 1 - (margin / 100);
      if (u <= 0) u = 0.01;

      const finalPrice = costWithTax / u;
      const roundedPrice = Math.ceil(finalPrice / 100) * 100;

      if (product.price !== roundedPrice) {
        await prisma.product.update({
          where: { id: product.id },
          data: { price: roundedPrice }
        });
        updatedCount++;
      }
    }

    return NextResponse.json({ success: true, updatedCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
