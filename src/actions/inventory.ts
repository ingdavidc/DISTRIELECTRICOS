'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getInventoryProducts() {
  try {
    const data = await prisma.product.findMany({
      include: { category: true, supplier: true, altSupplier: true },
      orderBy: { createdAt: 'desc' }
    });
    return JSON.parse(JSON.stringify(data));
  } catch (error: any) {
    console.error("Error fetching inventory products:", error);
    return { error: `Error DB: ${error.message}` } as any;
  }
}

export async function getCategories() {
  try {
    const data = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
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
  freqClientDiscount: number;
  volumeDiscount: number;
  corporateDiscount: number;
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

export type AiImportData = {
  supplier: { name: string; identification: string; email: string; phone: string; };
  products: { sku: string; name: string; quantity: number; cost: number; tax: number; }[];
};

export async function importAiData(data: AiImportData) {
  try {
    let supplierId: string | null = null;
    
    // 1. Manejar Proveedor
    if (data.supplier && data.supplier.name) {
      let supplier = await prisma.supplier.findFirst({
        where: {
          OR: [
            { nit: data.supplier.identification || "___" },
            { name: { contains: data.supplier.name, mode: "insensitive" } }
          ]
        }
      });
      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            name: data.supplier.name,
            nit: data.supplier.identification || "S/N",
            email: data.supplier.email || null,
            phone: data.supplier.phone || null,
            contactName: "Auto-creado por IA",
          }
        });
      }
      supplierId = supplier.id;
    }

    // 2. Buscar categoría general o crearla
    let category = await prisma.category.findFirst({ where: { name: "General" } });
    if (!category) {
      category = await prisma.category.create({ data: { name: "General" } });
    }

    // 3. Procesar Productos
    for (const item of data.products) {
      if (!item.sku || !item.name) continue;

      let product = await prisma.product.findUnique({ where: { sku: item.sku } });

      // Calcular precio de venta (PVP) sugerido basado en costo + 30% utilidad + IVA
      const profitMargin = 30; // 30% por defecto
      const subtotal = item.cost * (1 + (profitMargin / 100));
      const calculatedPrice = subtotal * (1 + ((item.tax || 19) / 100));
      const roundedPrice = Math.ceil(calculatedPrice / 100) * 100;

      if (product) {
        // Actualizar existente
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock + (item.quantity || 0),
            cost: item.cost || product.cost,
            supplierId: supplierId || product.supplierId
          }
        });

        // Registrar entrada de inventario
        if (item.quantity && item.quantity > 0) {
          await prisma.inventoryTransaction.create({
            data: {
              productId: product.id,
              type: "IN",
              quantity: item.quantity,
              reason: "Importación automática Factura PDF"
            }
          });
        }
      } else {
        // Crear nuevo
        const newProduct = await prisma.product.create({
          data: {
            sku: item.sku,
            name: item.name,
            categoryId: category.id,
            cost: item.cost || 0,
            tax: item.tax || 19,
            profitMargin,
            price: roundedPrice,
            stock: item.quantity || 0,
            unit: "Und",
            supplierId: supplierId
          }
        });

        if (item.quantity && item.quantity > 0) {
          await prisma.inventoryTransaction.create({
            data: {
              productId: newProduct.id,
              type: "IN",
              quantity: item.quantity,
              reason: "Importación inicial Factura PDF"
            }
          });
        }
      }
    }

    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Error importing AI data:", error);
    return { success: false, error: error.message };
  }
}
