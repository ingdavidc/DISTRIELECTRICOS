'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ── Shared guard ──────────────────────────────────────────────────────────────
async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error('NO_AUTH');
  return session;
}

// ── Allowed sets for validated enum fields ────────────────────────────────────
const ALLOWED_METHODS = new Set(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO', 'OTRO']);
const ALLOWED_RECEIPT_TYPES = new Set(['FACTURA', 'VOUCHER']);


export async function getPendingOrders() {
  try {
    await requireSession();
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
    if ((error as Error).message === 'NO_AUTH') return [];
    console.error('Error fetching pending orders:', error);
    return [];
  }
}

export async function searchCustomerOrdersForPayment(identification: string) {
  try {
    await requireSession();
    // Sanitize: only allow alphanumeric + common ID chars
    const cleanId = String(identification).replace(/[^a-zA-Z0-9\-\.]/g, '').slice(0, 20);
    if (!cleanId) return [];

    const customer = await prisma.customer.findUnique({ where: { identification: cleanId } });
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
    if ((error as Error).message === 'NO_AUTH') return [];
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
  receiptType: string;
}

interface ModifiedItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export async function processPayment(orderId: string, paymentData: PaymentData, modifiedItems?: ModifiedItem[]) {
  try {
    await requireSession();

    // ── Server-side validation of all payment fields ───────────────────────────
    if (!orderId || typeof orderId !== 'string') return { success: false, error: 'Orden inválida' };
    if (!isFinite(paymentData.amount) || paymentData.amount <= 0) {
      return { success: false, error: 'Monto de pago inválido' };
    }
    if (!ALLOWED_METHODS.has(paymentData.method)) {
      return { success: false, error: 'Método de pago inválido' };
    }
    if (!ALLOWED_RECEIPT_TYPES.has(paymentData.receiptType)) {
      return { success: false, error: 'Tipo de recibo inválido' };
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true }
      });

      if (!order) throw new Error('Orden no encontrada');
      if (order.status !== 'PENDING' && order.status !== 'OPEN_INVOICE') {
        throw new Error('Esta orden ya no admite abonos');
      }

      // ── Server-side amount validation against real balance ──────────────────
      const alreadyPaid = order.payments.reduce((s: number, p: any) => s + p.amount, 0);
      const outstanding = order.totalAmount - alreadyPaid;
      if (paymentData.amount > outstanding + 0.01) {
        throw new Error(`El monto (${paymentData.amount}) supera el saldo pendiente (${outstanding})`);
      }

      let finalItems = order.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice }));
      let finalTotal = order.totalAmount;
      const isFirstPayment = order.status === 'PENDING';

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

        // ── Atomic stock decrement (prevents race conditions) ─────────────────
        for (const item of finalItems) {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } }
          });
          if (updated.count === 0) {
            throw new Error(`Stock insuficiente para uno o más productos`);
          }
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

      await tx.orderPayment.create({
        data: {
          orderId,
          amount: paymentData.amount,
          method: paymentData.method,
          bank: paymentData.bank || null,
          transactionId: paymentData.transactionId || null,
          creditProvider: paymentData.creditProvider || null,
          creditDays: paymentData.creditDays || null
        }
      });

      const totalPaidSoFar = alreadyPaid + paymentData.amount;
      let newStatus: any = order.status;
      if (isFirstPayment) {
        newStatus = (totalPaidSoFar < finalTotal) ? 'OPEN_INVOICE' : 'PREPARING';
      } else {
        if (totalPaidSoFar >= finalTotal) newStatus = 'DELIVERED';
      }

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

    // Trigger n8n (fire-and-forget, never expose webhook errors to client)
    try {
      const { triggerN8nWebhook } = await import('@/lib/n8n');
      triggerN8nWebhook('new-sale', {
        orderId: result.id,
        amountPaid: paymentData.amount,
        totalAmount: result.totalAmount,
        method: paymentData.method,
        status: result.status,
        receiptType: paymentData.receiptType
      });
    } catch { /* webhook errors are non-fatal */ }

    return { success: true, orderId: result.id };
  } catch (error: any) {
    if (error.message === 'NO_AUTH') return { success: false, error: 'No autorizado' };
    console.error('Error procesando pago:', error);
    return { success: false, error: error.message || 'Error interno al aprobar' };
  }
}

export async function cancelOrder(orderId: string) {
  try {
    const session = await requireSession();
    // Only ADMIN and CASHIER roles can cancel orders
    const role = (session.user as any).role;
    if (!['ADMIN', 'CASHIER'].includes(role)) {
      return { success: false, error: 'No autorizado' };
    }
    if (!orderId || typeof orderId !== 'string') return { success: false, error: 'ID inválido' };

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' }
    });
    revalidatePath('/payments');
    return { success: true };
  } catch (error: any) {
    if (error.message === 'NO_AUTH') return { success: false, error: 'No autorizado' };
    return { success: false, error: 'Error al cancelar la orden' };
  }
}


