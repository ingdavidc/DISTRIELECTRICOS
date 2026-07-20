import { prisma } from '../src/lib/prisma';

async function main() {
  console.log("Updating stock for all products to 1000...");
  const result = await prisma.product.updateMany({
    data: { stock: 1000 }
  });
  console.log(`Updated ${result.count} products.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
