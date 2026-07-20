import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const { prisma } = await import('../src/lib/prisma');
  
  // Find Categories
  const cablesCat = await prisma.category.findFirst({ where: { name: 'Cables' } });
  const cablesYConductoresCat = await prisma.category.findFirst({ where: { name: 'Cables y Conductores' } });

  if (!cablesCat) {
    console.log("Categoría 'Cables' no encontrada.");
    return;
  }

  if (!cablesYConductoresCat) {
    console.log("Categoría 'Cables y Conductores' no encontrada.");
    return;
  }

  // Move any remaining products just in case
  const updateRes = await prisma.product.updateMany({
    where: { categoryId: cablesCat.id },
    data: { categoryId: cablesYConductoresCat.id }
  });
  console.log(`Movidos ${updateRes.count} productos de 'Cables' a 'Cables y Conductores'.`);

  // Delete 'Cables' category
  await prisma.category.delete({
    where: { id: cablesCat.id }
  });
  console.log("Categoría 'Cables' eliminada exitosamente.");
}

main()
  .catch(e => console.error(e))
  .finally(() => import('../src/lib/prisma').then(p => p.prisma.$disconnect()));
