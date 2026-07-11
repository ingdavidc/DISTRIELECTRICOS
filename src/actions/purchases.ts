'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getPurchaseOrders() {
  try {
    return await prisma.purchaseOrder.findMany({
      include: {
        supplier: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }
}

export async function getSuppliers() {
  try {
    const data = await prisma.supplier.findMany({ orderBy: { name: 'asc' } });
    return JSON.parse(JSON.stringify(data));
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function createSupplier(data: { name: string, email?: string, phone?: string }) {
  const supplier = await prisma.supplier.create({ data });
  revalidatePath('/inventory');
  return supplier;
}

export async function updateProductAdvanced(productId: string, data: { minStockLimit?: number, supplierId?: string, price?: number }) {
  await prisma.product.update({
    where: { id: productId },
    data
  });
  revalidatePath('/inventory');
  return { success: true };
}

// Logic triggered when an item drops below minStockLimit
export async function processAutoPurchase(tx: any, productId: string) {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product || !product.supplierId) return;

    // Check if we hit the threshold
    if (product.stock <= product.minStockLimit) {
        // Find existing pending PO for this supplier
        let po = await tx.purchaseOrder.findFirst({
            where: { supplierId: product.supplierId, status: 'PENDING' }
        });

        if (!po) {
            po = await tx.purchaseOrder.create({
                data: { supplierId: product.supplierId, status: 'PENDING' }
            });
        }

        // Check if item is already in PO
        const existingItem = await tx.purchaseOrderItem.findFirst({
            where: { purchaseOrderId: po.id, productId: product.id }
        });

        // Cálculo Inteligente de Reabastecimiento
        // Si tiene un Tope Máximo de Bodega configurado, pedimos lo necesario para llenarlo.
        // Si no, por defecto pedimos el doble del límite mínimo, garantizando al menos 10.
        let quantityNeeded = 10;
        if (product.maxStockLimit && product.maxStockLimit > product.stock) {
            quantityNeeded = product.maxStockLimit - product.stock;
        } else {
            quantityNeeded = Math.max((product.minStockLimit * 2) - product.stock, 10);
        }

        if (existingItem) {
            await tx.purchaseOrderItem.update({
                where: { id: existingItem.id },
                data: { quantityNeeded }
            });
        } else {
            await tx.purchaseOrderItem.create({
                data: {
                    purchaseOrderId: po.id,
                    productId: product.id,
                    quantityNeeded
                }
            });
        }
    }
}

import { sendPurchaseOrderEmail } from './email';

import { auth } from "@/auth";

export async function approvePurchaseOrder(
  orderId: string, 
  updatedItems: { id: string, quantityNeeded: number }[]
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, error: 'Acceso denegado. Solo un Administrador puede aprobar órdenes de compra.' };
  }

  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { supplier: true, items: { include: { product: true } } }
    });

    if (!order) return { success: false, error: 'Orden no encontrada' };

    // Actualizar cantidades o eliminar items con cantidad 0
    for (const item of updatedItems) {
      if (item.quantityNeeded <= 0) {
        await prisma.purchaseOrderItem.delete({ where: { id: item.id } });
      } else {
        await prisma.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantityNeeded: item.quantityNeeded }
        });
      }
    }

    // Refrescar los items finales
    const finalOrder = await prisma.purchaseOrder.findUnique({
      where: { id: orderId },
      include: { 
        supplier: true,
        items: { include: { product: true } } 
      }
    });

    if (!finalOrder || finalOrder.items.length === 0) {
      // Si la vaciaron toda, se cancela
      await prisma.purchaseOrder.update({ where: { id: orderId }, data: { status: 'CANCELLED' } });
      revalidatePath('/purchases');
      return { success: true, message: 'Orden cancelada (sin productos).' };
    }

    // Cambiar estado a aprobado
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { status: 'APPROVED' }
    });

    // Enviar correo
    if (finalOrder.supplier.email) {
      await sendPurchaseOrderEmail(finalOrder);
    }

    revalidatePath('/purchases');
    return { success: true, message: 'Orden aprobada y correo enviado.' };
  } catch (error) {
    console.error("Error aprobando orden:", error);
    return { success: false, error: "Error interno del servidor" };
  }
}
