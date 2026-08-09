import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
prisma.user.findMany({orderBy: {createdAt: 'desc'}, take: 5}).then(console.log).finally(() => prisma.$disconnect());
