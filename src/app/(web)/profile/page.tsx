import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";
import { auth } from "@/auth";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user orders
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", padding: "3rem 2rem" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <ProfileClient user={session.user} orders={orders} />
      </div>
    </div>
  );
}
