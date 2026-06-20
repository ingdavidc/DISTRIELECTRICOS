'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getInventoryProducts() {
  try {
    return await prisma.product.findMany({
      include: { category: true, supplier: true, altSupplier: true },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching inventory products:", error);
    return [];
  }
}

export async function getCategories() {
  return await prisma.category.findMany({ orderBy: { name: 'asc' } });
}

export type ProductInputData = {
  // Identificación
  sku: string;
  name: string;
  description?: string;
  brand?: string;
  categoryId: string;
  
  // Inventario
  unit: string;
  stock: number;
  minStockLimit: number;
  maxStockLimit?: number;
  location?: string;

  // Costos
  cost: number;
  profitMargin: number;
  tax: number;
  price: number; // PVP

  // Proveedores e Imagen
  supplierId?: string;
  altSupplierId?: string;
  imageUrl?: string;
};

export async function createProduct(data: ProductInputData) {
  try {
    const product = await prisma.product.create({ 
      data: {
        ...data,
        maxStockLimit: data.maxStockLimit || null,
        supplierId: data.supplierId || null,
        altSupplierId: data.altSupplierId || null,
      } 
    });
    revalidatePath('/inventory');
    return { success: true, product };
  } catch (error) {
    console.error("Error creating product:", error);
    return { success: false, error: "Error al crear el producto" };
  }
}

export async function updateProduct(id: string, data: ProductInputData) {
  try {
    const product = await prisma.product.update({ 
      where: { id },
      data: {
        ...data,
        maxStockLimit: data.maxStockLimit || null,
        supplierId: data.supplierId || null,
        altSupplierId: data.altSupplierId || null,
      } 
    });
    revalidatePath('/inventory');
    return { success: true, product };
  } catch (error) {
    console.error("Error updating product:", error);
    return { success: false, error: "Error al actualizar el producto" };
  }
}

export async function deleteProduct(id: string) {
  try {
    // Delete related records first to avoid foreign key constraints errors
    // Note: depending on the DB schema, cascade delete might be better configured in Prisma.
    // For now, let's just delete the product. If it has transactions/orders it might fail, which is good (we don't want to break history).
    await prisma.product.delete({ where: { id } });
    revalidatePath('/inventory');
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "No se puede eliminar porque tiene historial de compras o ventas asociado." };
  }
}
