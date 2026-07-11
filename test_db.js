const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const connectionString = 'postgresql://postgres.zygbddoqbjxfjqdfgvzo:nWk2KXe5cvzgZ%3Fe@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
const pool = new Pool({ connectionString, max: 2 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function run() {
  try {
    const prods = await prisma.product.findMany({ include: { category: true, supplier: true, altSupplier: true } });
    console.log('Products:', prods.length);
  } catch (e) {
    console.error('Error fetching:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
