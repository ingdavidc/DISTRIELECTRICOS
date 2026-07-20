"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ── Auth guard ─────────────────────────────────────────────────────────────────
async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("NO_AUTH");
  return session;
}

// ── Validation schemas ─────────────────────────────────────────────────────────
const customerSchema = z.object({
  identification: z.string().min(3).max(30).regex(/^[a-zA-Z0-9\-\.]+$/, "Solo alfanumérico"),
  name: z.string().min(2).max(120).trim(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(120).optional().nullable(),
  address: z.string().max(250).optional().nullable(),
  personType: z.string().max(50).optional().nullable(),
  taxRegime: z.string().max(100).optional().nullable(),
  taxResponsibilities: z.string().max(200).optional().nullable(),
  ciiuCode: z.string().max(20).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
});

export async function getCustomers() {
  try {
    await requireSession();
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { orders: true } } }
    });
    return customers;
  } catch (error) {
    if ((error as Error).message === "NO_AUTH") return [];
    console.error("Error fetching customers:", error);
    return [];
  }
}

export async function searchCustomers(query: string) {
  if (!query) return [];
  try {
    await requireSession();
    // Sanitize: limit length and strip non-printable
    const q = String(query).slice(0, 60).trim();
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { identification: { contains: q } },
          { name: { contains: q, mode: "insensitive" } },
        ]
      },
      take: 5
    });
    return customers;
  } catch (error) {
    if ((error as Error).message === "NO_AUTH") return [];
    console.error("Error searching customers:", error);
    return [];
  }
}

export async function createCustomer(data: unknown) {
  try {
    await requireSession();
    const parsed = customerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Datos del cliente inválidos: " + parsed.error.issues[0].message };
    }
    const safe = parsed.data;

    const existing = await prisma.customer.findUnique({ where: { identification: safe.identification } });
    if (existing) return { success: false, error: "Ya existe un cliente con esta identificación" };

    const customer = await prisma.customer.create({
      data: {
        identification: safe.identification,
        name: safe.name,
        phone: safe.phone || null,
        email: safe.email || null,
        address: safe.address || null,
        personType: safe.personType || null,
        taxRegime: safe.taxRegime || null,
        taxResponsibilities: safe.taxResponsibilities || null,
        ciiuCode: safe.ciiuCode || null,
        city: safe.city || null,
        department: safe.department || null,
      }
    });

    revalidatePath("/customers");
    revalidatePath("/pos");
    return { success: true, customer };
  } catch (error: any) {
    if (error.message === "NO_AUTH") return { success: false, error: "No autorizado" };
    console.error("Error creating customer:", error);
    return { success: false, error: "Error al registrar cliente" };
  }
}

export async function updateCustomer(id: string, data: unknown) {
  try {
    await requireSession();
    if (!id || typeof id !== "string") return { success: false, error: "ID inválido" };

    const parsed = customerSchema.partial().safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos: " + parsed.error.issues[0].message };
    }
    const safe = parsed.data;

    const updateData: any = {};
    if (safe.identification !== undefined) updateData.identification = safe.identification;
    if (safe.name !== undefined) updateData.name = safe.name;
    if (safe.phone !== undefined) updateData.phone = safe.phone;
    if (safe.email !== undefined) updateData.email = safe.email;
    if (safe.address !== undefined) updateData.address = safe.address;
    if (safe.personType !== undefined) updateData.personType = safe.personType;
    if (safe.taxRegime !== undefined) updateData.taxRegime = safe.taxRegime;
    if (safe.taxResponsibilities !== undefined) updateData.taxResponsibilities = safe.taxResponsibilities;
    if (safe.ciiuCode !== undefined) updateData.ciiuCode = safe.ciiuCode;
    if (safe.city !== undefined) updateData.city = safe.city;
    if (safe.department !== undefined) updateData.department = safe.department;

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData
    });
    revalidatePath("/customers");
    return { success: true, customer };
  } catch (error: any) {
    if (error.message === "NO_AUTH") return { success: false, error: "No autorizado" };
    console.error("Error updating customer:", error);
    return { success: false, error: "Error al actualizar cliente" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const session = await requireSession();
    if ((session.user as any).role !== "ADMIN") {
      return { success: false, error: "Solo administradores pueden eliminar clientes" };
    }
    if (!id || typeof id !== "string") return { success: false, error: "ID inválido" };

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } }
    });
    if (!customer) return { success: false, error: "Cliente no encontrado" };
    if (customer._count.orders > 0) {
      return { success: false, error: `No se puede eliminar. El cliente tiene ${customer._count.orders} compras registradas.` };
    }

    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { success: true };
  } catch (error: any) {
    if (error.message === "NO_AUTH") return { success: false, error: "No autorizado" };
    console.error("Error deleting customer:", error);
    return { success: false, error: "Error interno al eliminar" };
  }
}

export async function getCustomerOrders(customerId: string) {
  try {
    await requireSession();
    if (!customerId || typeof customerId !== "string") return [];

    const orders = await prisma.order.findMany({
      where: { customerId },
      include: {
        items: { include: { product: true } },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });
    return orders;
  } catch (error) {
    if ((error as Error).message === "NO_AUTH") return [];
    console.error("Error fetching customer orders:", error);
    return [];
  }
}
