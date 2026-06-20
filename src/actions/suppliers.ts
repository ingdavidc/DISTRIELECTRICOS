"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true, purchaseOrders: true }
        }
      }
    });
    return suppliers;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return [];
  }
}

export async function createSupplier(data: any) {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        nit: data.nit,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        category: data.category,
        paymentTerms: data.paymentTerms,
        status: data.status,
        taxRegime: data.taxRegime,
        bankDetails: data.bankDetails,
        paymentMethod: data.paymentMethod,
        creditLimit: parseFloat(data.creditLimit) || 0,
        cxpAccount: data.cxpAccount,
        expenseAccount: data.expenseAccount,
        retentionCodes: data.retentionCodes,
      }
    });
    revalidatePath('/suppliers');
    return { success: true, supplier };
  } catch (error) {
    console.error("Error creating supplier:", error);
    return { success: false, error: "Error al crear proveedor" };
  }
}

export async function updateSupplier(id: string, data: any) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        nit: data.nit,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        category: data.category,
        paymentTerms: data.paymentTerms,
        status: data.status,
        taxRegime: data.taxRegime,
        bankDetails: data.bankDetails,
        paymentMethod: data.paymentMethod,
        creditLimit: parseFloat(data.creditLimit) || 0,
        cxpAccount: data.cxpAccount,
        expenseAccount: data.expenseAccount,
        retentionCodes: data.retentionCodes,
      }
    });
    revalidatePath('/suppliers');
    // Si modificamos el proveedor, también deberíamos revalidar compras
    revalidatePath('/purchases');
    return { success: true, supplier };
  } catch (error) {
    console.error("Error updating supplier:", error);
    return { success: false, error: "Error al actualizar proveedor" };
  }
}

export async function deleteSupplier(id: string) {
  try {
    // Verificar dependencias
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, purchaseOrders: true }
        }
      }
    });

    if (!supplier) {
      return { success: false, error: "Proveedor no encontrado" };
    }

    if (supplier._count.products > 0 || supplier._count.purchaseOrders > 0) {
      return { 
        success: false, 
        error: `No se puede eliminar. El proveedor tiene ${supplier._count.products} productos y ${supplier._count.purchaseOrders} órdenes de compra vinculadas.` 
      };
    }

    await prisma.supplier.delete({
      where: { id }
    });

    revalidatePath('/suppliers');
    return { success: true };
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return { success: false, error: "Error interno al eliminar" };
  }
}
