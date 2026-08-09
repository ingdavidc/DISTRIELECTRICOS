"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("NO_AUTH");
  return session;
}

export async function createReturnRequest(orderId: string, items: { orderItemId: string; quantity: number; unitPrice: number }[], reason: string) {
  try {
    const session = await requireSession();
    
    // Validate order exists and belongs to a valid state
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return { success: false, error: "Orden no encontrada" };
    
    // Calculate total amount being returned
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        userId: session.user.id,
        reason,
        amount: totalAmount,
        status: "PENDING_AUTHORIZATION",
        items: {
          create: items.map(item => ({
            orderItemId: item.orderItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        }
      }
    });

    revalidatePath("/pos");
    revalidatePath("/payments");
    
    return { success: true, returnRequest };
  } catch (error: any) {
    console.error("Error creating return request:", error);
    return { success: false, error: error.message };
  }
}

export async function getPendingReturns() {
  try {
    await requireSession();
    return await prisma.returnRequest.findMany({
      where: { status: "PENDING_AUTHORIZATION" },
      include: {
        order: {
          include: { customer: true }
        },
        items: {
          include: {
            orderItem: {
              include: { product: true }
            }
          }
        }
      },
      orderBy: { createdAt: "asc" }
    });
  } catch (error) {
    return [];
  }
}

export async function processReturnRequest(requestId: string, approved: boolean) {
  try {
    const session = await requireSession();
    
    const req = await prisma.returnRequest.findUnique({
      where: { id: requestId },
      include: { items: { include: { orderItem: true } } }
    });
    
    if (!req) return { success: false, error: "Solicitud no encontrada" };
    if (req.status !== "PENDING_AUTHORIZATION") return { success: false, error: "La solicitud ya fue procesada" };

    if (!approved) {
      await prisma.returnRequest.update({
        where: { id: requestId },
        data: { status: "REJECTED", userId: session.user.id }
      });
    } else {
      await prisma.$transaction(async (tx) => {
        // Update request status
        await tx.returnRequest.update({
          where: { id: requestId },
          data: { status: "APPROVED", userId: session.user.id }
        });

        // Add stock back to inventory and create inventory transactions
        for (const rItem of req.items) {
          await tx.product.update({
            where: { id: rItem.orderItem.productId },
            data: { stock: { increment: rItem.quantity } }
          });
          
          await tx.inventoryTransaction.create({
            data: {
              productId: rItem.orderItem.productId,
              type: "IN",
              quantity: rItem.quantity,
              reason: `Devolución - Orden #${req.orderId.slice(0,8)}`
            }
          });
        }
      });
    }

    revalidatePath("/pos");
    revalidatePath("/payments");
    revalidatePath("/inventory");

    return { success: true };
  } catch (error: any) {
    console.error("Error processing return:", error);
    return { success: false, error: error.message };
  }
}

export async function getPosReturnRequests() {
  const session = await requireSession();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const requests = await prisma.returnRequest.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: today }
    },
    include: {
      order: {
        include: {
          customer: true
        }
      },
      items: {
        include: {
          orderItem: {
            include: {
              product: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return requests;
}
