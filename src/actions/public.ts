"use server";

import { prisma } from "@/lib/prisma";

export async function getPublicOrderReceipt(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        items: {
          include: { product: true }
        },
        payments: true
      }
    });
    return JSON.parse(JSON.stringify(order));
  } catch (error: any) {
    console.error("Error in getPublicOrderReceipt:", error);
    return { error: error.message };
  }
}
