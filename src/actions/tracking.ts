"use server";

import { prisma } from "@/lib/prisma";

export async function trackOrder(orderId: string) {
  try {
    // Validate UUID format roughly to avoid database errors
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId.trim());
    
    if (!isUuid) {
      return { success: false, error: "El formato del número de ticket es inválido." };
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId.trim() },
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
