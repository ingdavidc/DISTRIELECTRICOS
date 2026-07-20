"use server";

import { prisma } from "@/lib/prisma";

export async function trackOrder(orderId: string) {
  try {
    const cleanId = orderId.trim();
    if (cleanId.length < 6) {
      return { success: false, error: "El número de ticket debe tener al menos 6 caracteres." };
    }

    const order = await prisma.order.findFirst({
      where: { 
        id: { startsWith: cleanId, mode: 'insensitive' }
      },
      select: {
        id: true,
        status: true,
        deliveryType: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
          }
        },
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return { success: false, error: "No pudimos encontrar ningún pedido con este número de ticket." };
    }

    return { 
      success: true, 
      order: {
        id: order.id,
        status: order.status,
        deliveryType: order.deliveryType,
        createdAt: order.createdAt,
        customerName: order.customer?.name || "Cliente General",
        itemCount: order.items.reduce((acc: number, item: any) => acc + item.quantity, 0),
        sampleItems: order.items.slice(0, 2).map((i: any) => i.product.name)
      } 
    };

  } catch (error: any) {
    console.error("Error in trackOrder:", error);
    return { success: false, error: "Hubo un problema al buscar tu pedido. Inténtalo de nuevo." };
  }
}
