import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CatalogClient from "./CatalogClient";

export default async function CatalogPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const categoryId = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const minPrice = typeof searchParams.minPrice === 'string' ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseFloat(searchParams.maxPrice) : undefined;

  // Build Prisma query
  const where: any = {};
  
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } }
    ];
  }

  if (categoryId && categoryId !== 'all') {
    where.categoryId = categoryId;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined && !isNaN(minPrice)) where.price.gte = minPrice;
    if (maxPrice !== undefined && !isNaN(maxPrice)) where.price.lte = maxPrice;
  }

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' } // could add sorting param later
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center" }}>Cargando catálogo...</div>}>
      <CatalogClient 
        products={products} 
        categories={categories} 
        currentCategory={categoryId || 'all'}
        currentQuery={q || ''}
        currentMin={minPrice}
        currentMax={maxPrice}
      />
    </Suspense>
  );
}
