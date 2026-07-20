import { prisma } from './src/lib/prisma';

async function main() {
  try {
    const config = await prisma.webConfig.findUnique({
      where: { id: "default" }
    });
    console.log("Config from DB:", JSON.stringify(config, null, 2));
  } catch (e: any) {
    console.error("Error reading config:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
