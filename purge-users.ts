import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        not: "administracion@distrielectricoseyd.com",
      },
    },
  });
  console.log(`Deleted ${result.count} users.`);
}

main().finally(() => prisma.$disconnect());
