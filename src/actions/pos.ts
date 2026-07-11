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
    let serverTotalAmount = 0;
    const itemsWithServerPrice = [];

    // 1. Validar stock y recalcular precio real desde BD
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || (product.stock < item.quantity && !product.sku.startsWith("ESP-"))) {
        return { success: false, error: `Stock insuficiente para el producto ${product?.name || item.productId}` };
      }
      
      const realUnitPrice = product.price;
      serverTotalAmount += realUnitPrice * item.quantity;
      
      itemsWithServerPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: realUnitPrice
      });
    }

    // 2. Crear la Orden (Estado PENDING - Esperando Pago) con el precio verificado
    const order = await prisma.order.create({
      data: {
        status: 'PENDING',
        totalAmount: serverTotalAmount,
        customer: customerId ? { connect: { id: customerId } } : undefined,
        notes,
        deliveryType,
        items: {
          create: itemsWithServerPrice
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

export async function createSpecialProduct(name: string, price: number) {
  try {
    const product = await prisma.product.create({
      data: {
        sku: `ESP-${Date.now()}`,
        name: `[ESPECIAL] ${name}`,
        price: price,
        stock: 0,
        cost: 0, // No trackeamos costo de productos especiales adhoc
        tax: 0,
        profitMargin: 0,
        unit: "UNIDAD",
      }
    });
    return { success: true, product };
  } catch (error: any) {
    console.error("Error creating special product:", error);
    return { success: false, error: error.message };
  }
}
