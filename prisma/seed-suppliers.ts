import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding suppliers...');

  const supplier1 = await prisma.supplier.create({
    data: { name: 'Schneider Electric', email: 'ventas@schneider.com' }
  });

  const supplier2 = await prisma.supplier.create({
    data: { name: 'Centelsa', email: 'pedidos@centelsa.com' }
  });

  // Assign suppliers to existing products
  await prisma.product.updateMany({
    where: { sku: { contains: 'INT' } },
    data: { supplierId: supplier1.id, minStockLimit: 15 } // Breakers
  });

  await prisma.product.updateMany({
    where: { sku: { contains: 'CBL' } },
    data: { supplierId: supplier2.id, minStockLimit: 500 } // Cables
  });

  await prisma.product.updateMany({
    where: { sku: { contains: 'LED' } },
    data: { supplierId: supplier1.id, minStockLimit: 20 }
  });

  console.log('Suppliers seeded and assigned to products!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
