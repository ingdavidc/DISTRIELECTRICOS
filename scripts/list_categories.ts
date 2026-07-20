import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });
console.log("DB URL:", process.env.DATABASE_URL?.substring(0, 20) + "...");

async function main() {
  const { prisma } = await import('../src/lib/prisma');
  const categories = await prisma.category.findMany();
  console.log("Categories:");
  categories.forEach(c => console.log(`- ${c.name} (${c.id})`));
}

main().finally(() => prisma.$disconnect());
