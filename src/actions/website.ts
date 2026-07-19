"use server";

import { prisma } from "@/lib/prisma";

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
}) {
  await getSession();

  return await prisma.webConfig.update({
    where: { id: "default" },
    data
  });
}

export async function searchProducts(query: string) {
  await getSession();
  if (!query) return [];
  return await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { sku: { contains: query, mode: "insensitive" } }
      ]
    },
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
