import { prisma } from './src/lib/prisma';

async function main() {
  const count = await prisma.category.count();
  console.log('Total categories:', count);
  
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, _count: { select: { products: true } } },
    orderBy: { products: { _count: 'desc' } }
  });
  
  console.log('Top 10 Categories:', categories.slice(0, 10));
  console.log('Bottom Categories (with 1 or 0 products):', categories.filter(c => c._count.products <= 1).length);
}

main().finally(() => prisma.$disconnect());
