'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { logUserAction } from './logs';
import { auth } from '@/auth';

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error('NO_AUTH');
  return session;
}

export async function getInventoryProducts(limit?: number, sortField: string = 'createdAt', sortOrder: 'asc' | 'desc' = 'desc') {
  try {
    await requireSession();
    const orderBy: any = {};
    if (sortField === 'category') {
      orderBy.category = { name: sortOrder };
    } else {
      orderBy[sortField] = sortOrder;
    }
    
    const data = await prisma.product.findMany({
      include: { category: true, supplier: true, altSupplier: true },
      orderBy,
      ...(limit ? { take: limit } : {})
    });
    return JSON.parse(JSON.stringify(data));
  } catch (error: any) {
    if (error.message === 'NO_AUTH') return { error: 'No autorizado' } as any;
    console.error('Error fetching inventory products:', error);
    return { error: 'Error al cargar productos' } as any;
  }
}

export async function getTotalProductsCount() {
  try {
    return await prisma.product.count();
  } catch (error) {
    console.error('Error fetching total products count:', error);
    return 0;
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

export async function createCategory(name: string) {
  try {
    const data = await prisma.category.create({ data: { name } });
    revalidatePath('/inventory');
    return { success: true, data: JSON.parse(JSON.stringify(data)) };
  } catch (error: any) {
    console.error("Error creating category:", error);
    return { error: `Error: ${error.message}` };
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if there are products attached
    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return { error: `No se puede eliminar. Hay ${productsCount} producto(s) usando esta categoría.` };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath('/inventory');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting category:", error);
    return { error: `Error: ${error.message}` };
  }
}

export type ProductInputData = {
  sku: string;
  name: string;
  commercialName?: string;
  description?: string;
  features?: string;
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
  imageUrls?: string[];
  technicalSheetUrl?: string;
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
    
    await logUserAction("CREAR_PRODUCTO", `SKU: ${data.sku} | Nombre: ${data.name}`);
    
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
    
    await logUserAction("ACTUALIZAR_PRODUCTO", `SKU: ${data.sku} | Nombre: ${data.name}`);
    
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

export type AiPreviewProduct = {
  sku: string;
  name: string;
  quantity: number;
  cost: number;
  tax: number;
  isNew: boolean;
  currentCost?: number;
  currentStock?: number;
  resolution?: "KEEP_OLD" | "UPDATE_NEW" | "AVERAGE";
  deleted?: boolean;
};

export type AiPreviewData = {
  supplier: { name: string; identification: string; email: string; phone: string; };
  products: AiPreviewProduct[];
};

export async function previewAiImport(data: AiImportData): Promise<AiPreviewData> {
  const previewProducts: AiPreviewProduct[] = [];
  
  for (const item of data.products) {
    if (!item.sku) continue;
    const existing = await prisma.product.findUnique({ where: { sku: item.sku } });
    
    previewProducts.push({
      ...item,
      isNew: !existing,
      currentCost: existing ? existing.cost : undefined,
      currentStock: existing ? existing.stock : undefined,
      resolution: "UPDATE_NEW", // default
      deleted: false
    });
  }

  return {
    supplier: data.supplier,
    products: previewProducts
  };
}

export async function importAiData(data: AiPreviewData) {
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
      if (!item.sku || !item.name || item.deleted) continue;

      let product = await prisma.product.findUnique({ where: { sku: item.sku } });

      let finalCost = item.cost;
      if (product) {
        if (item.resolution === "KEEP_OLD") {
          finalCost = product.cost;
        } else if (item.resolution === "AVERAGE") {
          const oldTotal = product.cost * product.stock;
          const newTotal = item.cost * (item.quantity || 0);
          const totalStock = product.stock + (item.quantity || 0);
          finalCost = totalStock > 0 ? (oldTotal + newTotal) / totalStock : item.cost;
        }
      }

      // Calcular precio de venta (PVP) sugerido basado en costo + 30% utilidad + IVA
      const profitMargin = product ? product.profitMargin : 30;
      const subtotal = finalCost * (1 + (profitMargin / 100));
      const calculatedPrice = subtotal * (1 + ((item.tax || 19) / 100));
      const roundedPrice = Math.ceil(calculatedPrice / 100) * 100;

      if (product) {
        // Actualizar existente
        await prisma.product.update({
          where: { id: product.id },
          data: {
            stock: product.stock + (item.quantity || 0),
            cost: finalCost,
            price: roundedPrice,
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
