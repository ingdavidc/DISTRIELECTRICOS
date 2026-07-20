import { prisma } from "@/lib/prisma";
import WebHomeClient from "./WebHomeClient";
import { getWebConfig, getWebGallery } from "@/actions/website";

export default async function WebHomePage() {
  // Fetch dynamic CMS data
  const config = await getWebConfig();
  const gallery = await getWebGallery();
  
  let products: any[] = [];
  
  if (config.featuredAuto) {
    // Modo automático: traemos los últimos creados con algo de stock o los más caros (como placeholder)
    products = await prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: { createdAt: "desc" },
      take: 8
    });
  } else {
    // Modo manual
    if (config.featuredProductIds && config.featuredProductIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: config.featuredProductIds } }
      });
    }
  }

  // If no products found, fetch some defaults so it doesn't look empty
  if (products.length === 0) {
    products = await prisma.product.findMany({
      take: 4
    });
  }

  // Fetch promo products
  let promoProducts: any[] = [];
  if (config.promoProductIds && config.promoProductIds.length > 0) {
    promoProducts = await prisma.product.findMany({
      where: { id: { in: config.promoProductIds } }
    });
  }

  const { getB2BUser } = await import("@/actions/b2b-login");
  const b2bUser = await getB2BUser();

  const applyDiscount = (p: any) => {
    if (b2bUser && p.corporateDiscount > 0) {
      return {
        ...p,
        price: p.price * (1 - p.corporateDiscount / 100),
        originalPrice: p.price
      };
    }
    return p;
  };

  const finalProducts = products.map(applyDiscount);
  const finalPromoProducts = promoProducts.map(applyDiscount);

  return <WebHomeClient config={config} gallery={gallery} products={finalProducts} promoProducts={finalPromoProducts} />;
}
