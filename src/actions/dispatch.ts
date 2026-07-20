"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getOrdersForDispatch() {
  try {
    const orders = await prisma.order.findMany({
      where: { 
        status: { in: ['PREPARING', 'OPEN_INVOICE', 'READY'] } 
      },
      include: {
        customer: true,
        items: {
          include: { product: true }
        }
      },
      orderBy: [
        { deliveryType: 'desc' }, // 'RETIRO' comes before 'DOMICILIO' alphabetically
        { createdAt: 'asc' }
      ]
    });
    return orders;
  } catch (error) {
    console.error("Error fetching dispatch orders:", error);
    return [];
  }
}

export async function markOrderAsReady(orderId: string) {
  try {
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY' },
      include: { customer: true }
    });

    // Send Automatic WhatsApp
    if (updated.customer?.phone) {
      try {
        const { sendWhatsAppTemplate } = await import('@/lib/whatsapp');
        const shortId = updated.id.slice(0, 8).toUpperCase();
        
        if (updated.deliveryType === 'DOMICILIO') {
          const avg = await getAverageDispatchTime();
          await sendWhatsAppTemplate(updated.customer.phone, "pedido_enviado_domicilio", [
            updated.customer.name, 
            shortId, 
            avg
          ]);
        } else {
          await sendWhatsAppTemplate(updated.customer.phone, "pedido_listo_bodega", [
            updated.customer.name, 
            shortId
          ]);
        }
      } catch (e) {
        console.error('WhatsApp Dispatch Failed', e);
      }
    }

    revalidatePath('/dispatch');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar estado" };
  }
}

export async function markOrderAsDelivered(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DELIVERED' }
    });
    revalidatePath('/dispatch');
    revalidatePath('/payments');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error al actualizar estado" };
  }
}

export async function getAverageDispatchTime() {
  try {
    const recentOrders = await prisma.order.findMany({
      where: {
        status: { in: ['READY', 'DELIVERED'] },
        updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: { createdAt: true, updatedAt: true }
    });
    
    if (recentOrders.length === 0) return "15-20 min";

    const totalDiff = recentOrders.reduce((sum, order) => {
      return sum + (order.updatedAt.getTime() - order.createdAt.getTime());
    }, 0);

    const avgMs = totalDiff / recentOrders.length;
    const avgMinutes = Math.round(avgMs / 60000);
    
    // Para que sea realista e incluya la preparacion, calculamos un rango
    const minTime = Math.max(5, avgMinutes);
    const maxTime = minTime + 5;
    
    return `${minTime} a ${maxTime} min`;
  } catch (error) {
    return "15-20 min";
  }
}
