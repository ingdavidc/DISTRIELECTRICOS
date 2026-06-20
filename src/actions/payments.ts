"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getPendingOrders() {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'PENDING' },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true
      },
      orderBy: { createdAt: 'asc' }
    });
    return orders;
  } catch (error) {
    console.error("Error fetching pending orders:", error);
    return [];
  }
}

export async function searchCustomerOrdersForPayment(identification: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { identification }
    });
    if (!customer) return [];

    return await prisma.order.findMany({
      where: {
        customerId: customer.id,
        status: { in: ['PENDING', 'OPEN_INVOICE'] }
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    return [];
  }
}

interface PaymentData {
  amount: number;
  method: string; 
  bank?: string;
  transactionId?: string;
  creditProvider?: string;
  creditDays?: number;
  receiptType: string; // FACTURA o VOUCHER
}

interface ModifiedItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export async function processPayment(orderId: string, paymentData: PaymentData, modifiedItems?: ModifiedItem[]) {
  try {
    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true }
      });

      if (!order) throw new Error("Orden no encontrada");
      if (order.status !== 'PENDING' && order.status !== 'OPEN_INVOICE') {
        throw new Error("Esta orden ya no admite abonos");
      }

      let finalItems = order.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice }));
      let finalTotal = order.totalAmount;
      const isFirstPayment = order.status === 'PENDING';

      // Si es el primer pago (estaba en PENDING), permitimos auditar el pedido y descontamos stock
      if (isFirstPayment) {
        if (modifiedItems && modifiedItems.length > 0) {
          finalItems = modifiedItems;
          finalTotal = modifiedItems.reduce((acc: any, item: any) => acc + (item.quantity * item.unitPrice), 0);

          await tx.orderItem.deleteMany({ where: { orderId } });
          await tx.orderItem.createMany({
            data: modifiedItems.map((item: any) => ({
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice
            }))
          });
        }

        // Descontar inventario
        for (const item of finalItems) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new Error(`Producto no encontrado`);
          if (product.stock < item.quantity) throw new Error(`Stock insuficiente para el producto`);

          await tx.product.update({
            where: { id: item.productId },
            data: { stock: product.stock - item.quantity }
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: 'OUT',
              quantity: item.quantity,
              reason: `Caja #${order.id}`
            }
          });
        }
      }

      // Registrar el nuevo Abono
      await tx.orderPayment.create({
        data: {
          orderId,
          amount: paymentData.amount,
          method: paymentData.method,
          bank: paymentData.bank,
          transactionId: paymentData.transactionId,
          creditProvider: paymentData.creditProvider,
          creditDays: paymentData.creditDays
        }
      });

      // Calcular nuevo balance
      const totalPaidSoFar = order.amountPaid + paymentData.amount;
      
      let newStatus: any = order.status;
      if (isFirstPayment) {
        // Al pagar por primera vez, pasa a bodega o se cierra si no manejamos entrega separada.
        // Como el sistema pasa a bodega (PREPARING) o OPEN_INVOICE
        newStatus = (totalPaidSoFar < finalTotal) ? 'OPEN_INVOICE' : 'PREPARING';
      } else {
        // Si ya estaba en OPEN_INVOICE y pagó todo, puede pasar a DELIVERED o mantenerse si manejamos la entrega separado
        if (totalPaidSoFar >= finalTotal) {
           newStatus = 'DELIVERED'; // O mantener READY si es el caso, pero simplificamos.
        }
      }

      // Actualizar Orden
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: newStatus as any,
          totalAmount: finalTotal,
          amountPaid: totalPaidSoFar,
          receiptType: paymentData.receiptType
        }
      });

      return updatedOrder;
    });

    revalidatePath('/payments');
    revalidatePath('/dispatch'); 
    revalidatePath('/inventory');
    revalidatePath('/dashboard');
    
    return { success: true, orderId: result.id };
  } catch (error: any) {
    console.error("Error procesando pago:", error);
    return { success: false, error: error.message || "Error interno al aprobar" };
  }
}

export async function cancelOrder(orderId: string) {
    try {
        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' }
        });
        revalidatePath('/payments');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: "Error al cancelar la orden" };
    }
}
