import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding simulated purchase orders...');

  // Get suppliers
  const suppliers = await prisma.supplier.findMany();
  
  for (const supplier of suppliers) {
    // Find products for this supplier
    const products = await prisma.product.findMany({
      where: { supplierId: supplier.id },
      take: 3 // Take up to 3 products
    });

    if (products.length > 0) {
      // Create a draft Purchase Order
      const po = await prisma.purchaseOrder.create({
        data: {
          supplierId: supplier.id,
          status: 'PENDING',
        }
      });

      // Add items
      for (const product of products) {
        // Calculate a random quantity based on max stock limit
        const qty = product.maxStockLimit ? Math.floor(product.maxStockLimit / 2) : 20;

        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: po.id,
            productId: product.id,
            quantityNeeded: qty
          }
        });
        
        // Simular que el stock está bajo
        await prisma.product.update({
          where: { id: product.id },
          data: { stock: Math.floor(Math.random() * product.minStockLimit) }
        });
      }
      
      console.log(`Created PO for ${supplier.name} with ${products.length} items.`);
    }
  }

  console.log('Successfully seeded simulated purchase orders.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
