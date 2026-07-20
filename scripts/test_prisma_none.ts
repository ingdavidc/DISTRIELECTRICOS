import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const products = await prisma.product.findMany({
      where: {
        id: "NONE"
      }
    });
    console.log("Products found:", products.length);
  } catch (e: any) {
    console.error("Prisma error:", e.message);
  }
  
  try {
    const config = await prisma.webConfig.findUnique({
      where: { id: "default" }
    });
    console.log("Config flashOfferIds:", config?.flashOfferIds);
  } catch (e: any) {
    console.error("Config error:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
