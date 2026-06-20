"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPosProducts(query: string = "") {
  try {
    const products = await prisma.product.findMany({
      where: query ? {
        OR: [
          { sku: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
        ]
      } : undefined,
      take: 50,
      orderBy: query ? { name: 'asc' } : {
        orderItems: {
          _count: 'desc'
        }
      }
    });
    return products;
  } catch (error) {
    console.error("Error fetching POS products:", error);
    return [];
  }
}

export async function submitOrderToCashier(items: { productId: string, quantity: number, unitPrice: number }[], totalAmount: number, customerId?: string, notes?: string, deliveryType: string = "RETIRO") {
  try {
    // 1. Validar que al menos haya stock suficiente al momento de tomar el pedido
    // (El descuento real se hace en Caja, pero evitamos enviar basura a caja)
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para el producto ${product?.name || item.productId}` };
      }
    }

    // 2. Crear la Orden (Estado PENDING - Esperando Pago)
    const order = await prisma.order.create({
      data: {
        status: 'PENDING',
        totalAmount,
        customer: customerId ? { connect: { id: customerId } } : undefined,
        notes,
        deliveryType,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      }
    });

    revalidatePath('/pos');
    revalidatePath('/payments'); // Nueva ruta de caja
    
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("Error submitting order:", error);
    return { success: false, error: error.message || "Error al enviar la orden a caja" };
  }
}
