"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSpecialRequest(data: {
  productName: string;
  quantity: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}) {
  try {
    const request = await prisma.specialRequest.create({
      data: {
        productName: data.productName,
        quantity: data.quantity,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes,
        status: "PENDING"
      }
    });
    
    revalidatePath("/pos");
    revalidatePath("/purchases");
    return { success: true, request };
  } catch (error: any) {
    console.error("Error creating special request:", error);
    return { success: false, error: error.message };
  }
}

export async function getSpecialRequests() {
  try {
    const requests = await prisma.specialRequest.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return requests;
  } catch (error) {
    console.error("Error fetching special requests:", error);
    return [];
  }
}

export async function updateSpecialRequestStatus(id: string, status: string) {
  try {
    await prisma.specialRequest.update({
      where: { id },
      data: { status }
    });
    revalidatePath("/purchases");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating special request:", error);
    return { success: false, error: error.message };
  }
}
