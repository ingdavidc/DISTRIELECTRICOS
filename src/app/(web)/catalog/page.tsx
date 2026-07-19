import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CatalogClient from "./CatalogClient";
import { getWebConfig } from "@/actions/website";

export const dynamic = 'force-dynamic';

export default async function CatalogPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const categoryId = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const minPrice = typeof searchParams.minPrice === 'string' ? parseFloat(searchParams.minPrice) : undefined;
  const maxPrice = typeof searchParams.maxPrice === 'string' ? parseFloat(searchParams.maxPrice) : undefined;
  const flash = searchParams.flash === 'true';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const take = 20;
  const skip = (Math.max(1, page) - 1) * take;

  const config = await getWebConfig();

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

  if (flash && config.flashOfferIds && config.flashOfferIds.length > 0) {
    where.id = { in: config.flashOfferIds };
  } else if (flash) {
    // Si flash=true pero no hay productos, forzamos un id inválido para que devuelva vacío
    where.id = "NONE";
  }

  const [products, totalCount, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [
        { salesCount: 'desc' }, // Order by most popular/sold
        { createdAt: 'desc' }
      ],
      take,
      skip
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      orderBy: { name: 'asc' }
    })
  ]);

  const totalPages = Math.ceil(totalCount / take);

  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center" }}>Cargando catálogo...</div>}>
      <CatalogClient 
        products={products} 
        categories={categories} 
        currentCategory={categoryId || 'all'}
        currentQuery={q || ''}
        currentMin={minPrice}
        currentMax={maxPrice}
        currentPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        isFlash={flash}
        flashOfferIds={config.flashOfferIds || []}
      />
    </Suspense>
  );
}
