"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { getExpertUser } from "@/actions/expert";
import { revalidatePath } from "next/cache";

export async function searchProductsForExpert(query: string) {
  if (!query || query.length < 2) return [];

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { commercialName: { contains: query, mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      sku: true,
      name: true,
      price: true,
      expertDiscount: true,
      stock: true,
      tax: true,
      imageUrl: true,
    },
    take: 10
  });

  return products.map(p => {
    const discountPercent = p.expertDiscount || 5;
    const discountedPrice = Math.round(p.price - (p.price * discountPercent / 100));
    return {
      ...p,
      discountedPrice
    };
  });
}

export async function createExpertWholesaleOrder({
  items,
  deliveryType,
  notes,
  paymentReceiptUrl
}: {
  items: { productId: string; quantity: number }[];
  deliveryType: "PICKUP" | "DELIVERY";
  notes?: string;
  paymentReceiptUrl: string;
}) {
  try {
    const [cookieUser, session] = await Promise.all([getExpertUser(), auth()]);
    const isExpertSession = (session?.user as any)?.role === "EXPERT";
    const userId = cookieUser?.id ?? (isExpertSession ? (session?.user as any)?.id : null);

    if (!userId) {
      return { success: false, error: "No autorizado" };
    }

    let serverTotalAmount = 0;
    const orderItems = [];

    // Verify stock and prices
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || product.stock < item.quantity) {
        return { success: false, error: `Stock insuficiente para ${product?.name || item.productId}` };
      }

      const discountPercent = product.expertDiscount || 5;
      const realUnitPrice = Math.round(product.price - (product.price * discountPercent / 100));

      serverTotalAmount += realUnitPrice * item.quantity;
      
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: realUnitPrice
      });
    }

    // Create the order as PENDING for Caja to approve
    const order = await prisma.order.create({
      data: {
        userId: userId, // Assuming the EXPERT user is the one creating it
        status: "PENDING", // Pendiente de revisión en CAJA
        totalAmount: serverTotalAmount,
        notes: `COMPRA MAYORISTA ALIADO EXPERTO\nEntrega: ${deliveryType === "PICKUP" ? "Recoger en Tienda" : "Envío a Domicilio"}\n${notes || ''}`,
        deliveryType: deliveryType,
        items: {
          create: orderItems
        },
        payments: {
          create: {
            amount: serverTotalAmount,
            method: "TRANSFERENCIA", // It's usually a transfer since they attach a receipt
            status: "PENDING",
            reference: paymentReceiptUrl, // Guardamos la URL del comprobante en el campo reference
            notes: "Comprobante subido desde Portal Aliados"
          }
        }
      }
    });

    // Deduct stock temporarily to reserve it
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    revalidatePath("/payments");
    revalidatePath("/inventory");
    
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("Error creating expert order:", error);
    return { success: false, error: "Error al procesar la orden." };
  }
}
