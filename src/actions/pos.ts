"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { logUserAction } from "./logs";
import { auth } from "@/auth";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("NO_AUTH");
  return session;
}

export async function getPosProducts(query: string = "") {
  try {
    await requireSession();
    const q = String(query).slice(0, 100).trim();
    const products = await prisma.product.findMany({
      where: q ? {
        OR: [
          { sku: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
        ]
      } : undefined,
      take: 50,
      orderBy: q ? { name: 'asc' } : {
        orderItems: {
          _count: 'desc'
        }
      }
    });
    return products;
  } catch (error: any) {
    if (error.message === 'NO_AUTH') return [];
    console.error("Error fetching POS products:", error);
    return [];
  }
}

export async function submitOrderToCashier(
  items: { productId: string, quantity: number, unitPrice: number }[], 
  totalAmount: number, 
  customerId?: string, 
  notes?: string, 
  deliveryType: string = "RETIRO",
  priceTier: string = "NORMAL"
) {
  try {
    await requireSession();
    let serverTotalAmount = 0;
    const itemsWithServerPrice = [];

    // 1. Validar stock y recalcular precio real desde BD
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product || (product.stock < item.quantity && !product.sku.startsWith("ESP-"))) {
        return { success: false, error: `Stock insuficiente para el producto ${product?.name || item.productId}` };
      }
      
      let realUnitPrice = product.price;
      if (!product.sku.startsWith("ESP-")) {
        // @ts-ignore - Prisma types might not be perfectly synced yet
        const expertDcto = product.expertDiscount ?? 5;
        // @ts-ignore
        const volDcto = product.volumeDiscount ?? 10;
        // @ts-ignore
        const corpDcto = product.corporateDiscount ?? 15;

        if (priceTier === "EXPERTO") realUnitPrice = product.price - (product.price * expertDcto / 100);
        else if (priceTier === "VOLUMEN") realUnitPrice = product.price - (product.price * volDcto / 100);
        else if (priceTier === "CORPORATIVO") realUnitPrice = product.price - (product.price * corpDcto / 100);
        
        realUnitPrice = Math.round(realUnitPrice);
      } else {
        realUnitPrice = item.unitPrice; // Para productos especiales, confiar en el frontend
      }

      serverTotalAmount += realUnitPrice * item.quantity;
      
      itemsWithServerPrice.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: realUnitPrice
      });
    }

    // 2. Crear la Orden (Estado PENDING - Esperando Pago) con el precio verificado
    const order = await prisma.order.create({
      data: {
        status: 'PENDING',
        totalAmount: serverTotalAmount,
        customer: customerId ? { connect: { id: customerId } } : undefined,
        notes,
        deliveryType,
        items: {
          create: itemsWithServerPrice
        }
      }
    });

    await logUserAction("NUEVA_ORDEN_POS", `Monto total: $${serverTotalAmount.toFixed(2)} | Items: ${items.length} | Modalidad: ${deliveryType}`);
    
    revalidatePath('/pos');
    revalidatePath('/payments'); // Nueva ruta de caja
    
    return { success: true, orderId: order.id };
  } catch (error: any) {
    console.error("Error submitting order:", error);
    return { success: false, error: error.message || "Error al enviar la orden a caja" };
  }
}

export async function createSpecialProduct(name: string, price: number) {
  try {
    const product = await prisma.product.create({
      data: {
        sku: `ESP-${Date.now()}`,
        name: `[ESPECIAL] ${name}`,
        price: price,
        stock: 0,
        cost: 0, // No trackeamos costo de productos especiales adhoc
        tax: 0,
        profitMargin: 0,
        unit: "UNIDAD",
        category: {
          connectOrCreate: {
            where: { name: "Especiales" },
            create: { name: "Especiales", description: "Productos solicitados ad-hoc" }
          }
        },
      }
    });
    await logUserAction("CREAR_PRODUCTO_ESPECIAL", `Producto: ${name} | Precio: $${price.toFixed(2)}`);
    return { success: true, product };
  } catch (error: any) {
    console.error("Error creating special product:", error);
    return { success: false, error: error.message };
  }
}
