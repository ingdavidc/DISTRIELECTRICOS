"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { orders: true }
        }
      }
    });
    return customers;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function searchCustomers(query: string) {
  if (!query) return [];
  try {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { identification: { contains: query } },
          { name: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 5
    });
    return customers;
  } catch (error) {
    console.error("Error searching customers:", error);
    return [];
  }
}

export async function createCustomer(data: { identification: string, name: string, phone?: string, email?: string, address?: string }) {
  try {
    const existing = await prisma.customer.findUnique({
      where: { identification: data.identification }
    });

    if (existing) {
      return { success: false, error: "Ya existe un cliente con esta identificación" };
    }

    const customer = await prisma.customer.create({
      data
    });
    
    revalidatePath('/customers');
    revalidatePath('/pos');
    return { success: true, customer };
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return { success: false, error: error.message || "Error al registrar cliente" };
  }
}

export async function updateCustomer(id: string, data: any) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data
    });
    revalidatePath('/customers');
    return { success: true, customer };
  } catch (error) {
    console.error("Error updating customer:", error);
    return { success: false, error: "Error al actualizar cliente" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } }
    });

    if (!customer) return { success: false, error: "Cliente no encontrado" };

    if (customer._count.orders > 0) {
      return { success: false, error: `No se puede eliminar. El cliente tiene ${customer._count.orders} compras registradas.` };
    }

    await prisma.customer.delete({ where: { id } });
    revalidatePath('/customers');
    return { success: true };
  } catch (error) {
    console.error("Error deleting customer:", error);
    return { success: false, error: "Error interno al eliminar" };
  }
}

export async function getCustomerOrders(customerId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: {
          include: { product: true }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return orders;
  } catch (error) {
    console.error("Error fetching customer orders:", error);
    return [];
  }
}
