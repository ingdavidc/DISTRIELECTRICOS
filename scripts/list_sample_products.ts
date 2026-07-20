import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });


async function main() {
  const { prisma } = await import('../src/lib/prisma');
  const products = await prisma.product.findMany({
    take: 50,
    select: { name: true, category: { select: { name: true } } }
  });
  console.log("Sample Products:");
  products.forEach(p => console.log(`- ${p.name} (Current: ${p.category?.name || 'None'})`));
}

main().finally(() => prisma.$disconnect());
