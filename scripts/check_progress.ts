import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const { prisma } = await import('../src/lib/prisma');
  const grouped = await prisma.product.groupBy({
    by: ['categoryId'],
    _count: {
      _all: true
    }
  });
  console.log("Current categorization counts:");
  for (const group of grouped) {
    if (!group.categoryId) {
       console.log(`- Null: ${group._count._all}`);
       continue;
    }
    const cat = await prisma.category.findUnique({ where: { id: group.categoryId } });
    console.log(`- ${cat?.name || group.categoryId}: ${group._count._all}`);
  }
}

main().finally(() => import('../src/lib/prisma').then(p => p.prisma.$disconnect()));
