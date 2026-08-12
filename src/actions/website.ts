"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { triggerN8nWebhook } from "@/lib/n8n";

async function getSession() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (!session?.user) throw new Error("NO_AUTH");
  return session;
}

export async function getWebConfig() {
  let config = await prisma.webConfig.findUnique({
    where: { id: "default" }
  });

  if (!config) {
    config = await prisma.webConfig.create({
      data: { id: "default" }
    });
  }

  return config;
}

export async function updateWebConfig(data: {
  heroTitle?: string;
  heroSubtitle?: string;
  heroButtonText?: string;
  useAutoFeatured?: boolean;
  autoFeaturedCount?: number;
  featuredProductIds?: string[];
  flashOfferIds?: string[];
  promoProductIds?: string[];
}) {
  await getSession();

  // Obtener la config anterior para comparar
  const oldConfig = await prisma.webConfig.findUnique({ where: { id: "default" } });

  const res = await prisma.webConfig.update({
    where: { id: "default" },
    data
  });
  
  // Detectar nuevas Ofertas Flash
  if (data.flashOfferIds && oldConfig) {
    const newFlashIds = data.flashOfferIds.filter(id => !oldConfig.flashOfferIds.includes(id));
    if (newFlashIds.length > 0) {
      const newProducts = await prisma.product.findMany({ where: { id: { in: newFlashIds } } });
      await Promise.all(newProducts.map(p => 
        triggerN8nWebhook("publicaciones", { event: "new_flash_offer", product: p })
      ));
    }
  }

  // Detectar nuevas Herramientas y Novedades
  if (data.promoProductIds && oldConfig) {
    const newPromoIds = data.promoProductIds.filter(id => !oldConfig.promoProductIds.includes(id));
    if (newPromoIds.length > 0) {
      const newProducts = await prisma.product.findMany({ where: { id: { in: newPromoIds } } });
      await Promise.all(newProducts.map(p => 
        triggerN8nWebhook("publicaciones", { event: "new_promo_product", product: p })
      ));
    }
  }

  revalidatePath('/');
  revalidatePath('/catalog');
  revalidatePath('/pos');
  
  return res;
}

import { buildSearchTokenConditions } from "@/lib/searchUtils";

export async function searchProducts(query: string) {
  await getSession();
  if (!query) return [];
  const tokenConditions = buildSearchTokenConditions(query, ['name', 'sku']) || {};
  return await prisma.product.findMany({
    where: tokenConditions,
    take: 10,
    select: { id: true, name: true, price: true, imageUrl: true }
  });
}

export async function getProductsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return [];
  return await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, price: true, imageUrl: true }
  });
}

export async function getWebGallery() {
  return await prisma.webGallery.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function addGalleryItem(url: string, type: "IMAGE" | "VIDEO" = "IMAGE") {
  await getSession();

  // Insert new item
  const newItem = await prisma.webGallery.create({
    data: { url, type }
  });

  // Notificar a n8n
  await triggerN8nWebhook("publicaciones", { event: "new_gallery_item", item: newItem });

  // Check count, if > 10, delete oldest
  const count = await prisma.webGallery.count();
  if (count > 10) {
    const oldestItems = await prisma.webGallery.findMany({
      orderBy: { createdAt: "asc" },
      take: count - 10
    });
    
    // We only delete from DB. In a robust system we'd delete from Supabase too,
    // but doing it from DB is required for the FIFO logic.
    await prisma.webGallery.deleteMany({
      where: {
        id: { in: oldestItems.map((item: any) => item.id) }
      }
    });
  }

  return newItem;
}

export async function deleteGalleryItem(id: string) {
  await getSession();
  
  return await prisma.webGallery.delete({
    where: { id }
  });
}
