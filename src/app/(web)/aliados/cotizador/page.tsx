import { getExpertUser } from "@/actions/expert";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExpertQuoterClient from "./ExpertQuoterClient";

export default async function ExpertQuoterPage() {
  const user = await getExpertUser();
  if (!user) {
    redirect("/aliados");
  }

  // Fetch all products with their base price
  const products = await prisma.product.findMany({
    select: {
      id: true,
      sku: true,
      name: true,
      price: true, // Base PVP price
      brand: true,
      unit: true,
      stock: true,
    },
    orderBy: { popularity: 'desc' }
  });

  return (
    <div style={{ background: "var(--color-background-alt)", minHeight: "100vh" }}>
      <ExpertQuoterClient expertUser={user} products={products} />
    </div>
  );
}
