import { prisma } from "@/lib/prisma";
import HRClient from "@/components/admin/HRClient";

export const dynamic = "force-dynamic";

export default async function HRPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      identification: true,
      phone: true,
      role: true,
      modules: true,
      createdAt: true,
    },
  });

  return <HRClient initialUsers={users} />;
}
