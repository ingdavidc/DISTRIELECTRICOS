const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding random salesCount for existing products...');
  
  // We don't want to do 8700 single queries, let's just use raw SQL to generate random numbers
  await prisma.$executeRawUnsafe(`
    UPDATE "Product"
    SET "salesCount" = floor(random() * 1000 + 1)::int;
  `);

  console.log('Done!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
