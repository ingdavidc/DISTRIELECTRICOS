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
      orderBy: { createdAt: 'asc' }
    });
    return orders;
  } catch (error) {
    console.error("Error fetching dispatch orders:", error);
    return [];
  }
}

export async function markOrderAsReady(orderId: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'READY' }
    });
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
