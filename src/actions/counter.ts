"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function requestToCounter(productId: string, userId?: string) {
  try {
    const req = await prisma.counterRequest.create({
      data: {
        productId,
        userId,
        status: "PENDING",
      },
    });
    revalidatePath("/pos");
    revalidatePath("/dispatch");
    return { success: true, request: req };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function requestMultipleToCounter(productIds: string[], userId?: string) {
  try {
    const data = productIds.map(productId => ({
      productId,
      userId,
      status: "PENDING",
    }));
    await prisma.counterRequest.createMany({ data });
    
    revalidatePath("/pos");
    revalidatePath("/dispatch");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPendingCounterRequests() {
  try {
    const requests = await prisma.counterRequest.findMany({
      where: {
        status: { in: ["PENDING", "DELIVERED"] },
      },
      include: {
        product: true,
        user: true,
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    return requests;
  } catch (error: any) {
    console.error(error);
    return [];
  }
}

export async function markCounterRequestDelivered(id: string) {
  try {
    await prisma.counterRequest.update({
      where: { id },
      data: { status: "DELIVERED" },
    });
    revalidatePath("/dispatch");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markCounterRequestReturned(id: string) {
  try {
    await prisma.counterRequest.update({
      where: { id },
      data: { status: "RETURNED" },
    });
    revalidatePath("/dispatch");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
