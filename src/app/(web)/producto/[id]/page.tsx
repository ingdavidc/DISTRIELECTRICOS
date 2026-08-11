import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id }
  });

  if (!product) {
    return {
      title: "Producto no encontrado | DISTRIELECTRICOS"
    };
  }

  return {
    title: `${product.name} | DISTRIELECTRICOS`,
    description: product.description || `Comprar ${product.name} al mejor precio en DISTRIELECTRICOS.`,
    openGraph: {
      images: product.imageUrl ? [product.imageUrl] : []
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true
    }
  });

  if (!product) {
    notFound();
  }

  // Fetch similar products in the same category
  const similarProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      id: { not: product.id },
      stock: { gt: 0 }
    },
    take: 4,
    orderBy: { popularity: 'desc' }
  });

  // Check discounts
  const { getB2BUser } = await import("@/actions/b2b-login");
  const b2bUser = await getB2BUser();

  const { getExpertUser } = await import("@/actions/expert");
  const expertUser = await getExpertUser();

  const applyDiscount = (p: any) => {
    let finalPrice = p.price;
    if (b2bUser && p.corporateDiscount > 0) {
      finalPrice = p.price * (1 - p.corporateDiscount / 100);
    } else if (expertUser && p.expertDiscount > 0) {
      finalPrice = p.price * (1 - p.expertDiscount / 100);
    }

    if (finalPrice !== p.price) {
      return {
        ...p,
        price: finalPrice,
        originalPrice: p.price
      };
    }
    return p;
  };

  const finalProduct = applyDiscount(product);
  const finalSimilarProducts = similarProducts.map(applyDiscount);

  return (
    <ProductDetailClient 
      product={finalProduct} 
      similarProducts={finalSimilarProducts} 
    />
  );
}
