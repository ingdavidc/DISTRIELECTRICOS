import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Seeding database...');

  // Create Categories
  const category1 = await prisma.category.upsert({
    where: { name: 'Cables' },
    update: {},
    create: {
      name: 'Cables',
      description: 'Todo tipo de cables eléctricos',
    },
  });

  const category2 = await prisma.category.upsert({
    where: { name: 'Iluminación' },
    update: {},
    create: {
      name: 'Iluminación',
      description: 'Bombillos, lámparas, paneles LED',
    },
  });

  const category3 = await prisma.category.upsert({
    where: { name: 'Protecciones' },
    update: {},
    create: {
      name: 'Protecciones',
      description: 'Breakers, fusibles, tableros',
    },
  });

  // Create Products
  await prisma.product.upsert({
    where: { sku: 'CBL-001' },
    update: {},
    create: {
      sku: 'CBL-001',
      name: 'Cable THHN 12 AWG (Metro)',
      price: 2500,
      stock: 1000,
      categoryId: category1.id,
      imageUrl: 'https://images.unsplash.com/photo-1620022359487-1ec62de1ee5f?w=300&q=80',
    },
  });

  await prisma.product.upsert({
    where: { sku: 'INT-002' },
    update: {},
    create: {
      sku: 'INT-002',
      name: 'Interruptor Termomagnético 20A',
      price: 35000,
      stock: 50,
      categoryId: category3.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'CINT-003' },
    update: {},
    create: {
      sku: 'CINT-003',
      name: 'Cinta Aislante 3M',
      price: 4500,
      stock: 200,
      categoryId: category1.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'LED-009' },
    update: {},
    create: {
      sku: 'LED-009',
      name: 'Bombillo LED 9W',
      price: 6000,
      stock: 150,
      categoryId: category2.id,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
