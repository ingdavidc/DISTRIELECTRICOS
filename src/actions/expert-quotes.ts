"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createExpertQuote(data: {
  expertUserId: string;
  clientName: string;
  clientPhone?: string;
  notes?: string;
  totalPvp: number;
  totalWholesale: number;
  margin: number;
  items: {
    productId: string;
    quantity: number;
    pvpPrice: number;
    wholesalePrice: number;
  }[];
}) {
  try {
    const quote = await prisma.expertQuote.create({
      data: {
        expertUserId: data.expertUserId,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        notes: data.notes,
        totalPvp: data.totalPvp,
        totalWholesale: data.totalWholesale,
        margin: data.margin,
        items: {
          create: data.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            pvpPrice: i.pvpPrice,
            wholesalePrice: i.wholesalePrice
          }))
        }
      }
    });

    revalidatePath("/aliados/mis-cotizaciones");
    return { success: true, quote };
  } catch (error: any) {
    console.error("Error creating expert quote:", error);
    return { success: false, error: "Error al guardar la cotización" };
  }
}

export async function getExpertQuotes(expertUserId: string) {
  try {
    const quotes = await prisma.expertQuote.findMany({
      where: { expertUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true, imageUrl: true }
            }
          }
        }
      }
    });
    return { success: true, quotes };
  } catch (error: any) {
    console.error("Error fetching expert quotes:", error);
    return { success: false, error: "Error al cargar las cotizaciones" };
  }
}

export async function deleteExpertQuote(id: string) {
  try {
    await prisma.expertQuote.delete({
      where: { id }
    });
    revalidatePath("/aliados/mis-cotizaciones");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting quote:", error);
    return { success: false, error: "Error al eliminar la cotización" };
  }
}
