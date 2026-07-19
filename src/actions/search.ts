"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error('NO_AUTH');
  return session;
}

// Definición de atajos fijos
const SHORTCUTS = [
  { label: "Punto de Venta / Caja", url: "/pos", keywords: ["venta", "caja", "pos", "cobrar", "facturar", "punto de venta"] },
  { label: "Directorio de Clientes", url: "/customers", keywords: ["clientes", "directorio", "personas", "crm"] },
  { label: "Inventario de Productos", url: "/inventory", keywords: ["inventario", "productos", "stock", "bodega", "articulos"] },
  { label: "Crear Nuevo Producto", url: "/inventory?action=new", keywords: ["crear producto", "nuevo producto", "agregar producto"] },
  { label: "Proveedores", url: "/suppliers", keywords: ["proveedores", "distribuidores", "compras"] },
  { label: "Órdenes de Compra", url: "/purchases", keywords: ["ordenes de compra", "compras", "pedidos a proveedores"] },
  { label: "Despachos y Entregas", url: "/dispatch", keywords: ["despachos", "entregas", "envios", "transporte", "domicilios"] },
  { label: "Cotizaciones", url: "/quotes", keywords: ["cotizaciones", "presupuestos"] },
  { label: "Dashboard Principal", url: "/dashboard", keywords: ["dashboard", "inicio", "panel", "estadisticas"] },
];

export async function globalSearch(query: string) {
  try {
    await requireSession();

    if (!query || query.trim().length < 2) {
      return { products: [], customers: [], suppliers: [], orders: [], shortcuts: [] };
    }

    const searchStr = query.trim();

    // 1. Filtrar atajos
    const shortcuts = SHORTCUTS.filter(s => 
      s.label.toLowerCase().includes(searchStr.toLowerCase()) || 
      s.keywords.some(k => k.toLowerCase().includes(searchStr.toLowerCase()))
    );

    // 2. Buscar en base de datos en paralelo
    const [products, customers, suppliers, orders] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { sku: { contains: searchStr, mode: 'insensitive' } },
            { commercialName: { contains: searchStr, mode: 'insensitive' } },
            { brand: { contains: searchStr, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, name: true, sku: true, stock: true, price: true, imageUrl: true }
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { identification: { contains: searchStr, mode: 'insensitive' } },
            { phone: { contains: searchStr, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, name: true, identification: true, phone: true }
      }),
      prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: searchStr, mode: 'insensitive' } },
            { nit: { contains: searchStr, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, name: true, nit: true }
      }),
      // Para órdenes, buscamos por ID o notas
      prisma.order.findMany({
        where: {
          OR: [
            { id: { contains: searchStr, mode: 'insensitive' } },
            { notes: { contains: searchStr, mode: 'insensitive' } }
          ]
        },
        take: 5,
        select: { id: true, status: true, totalAmount: true, createdAt: true, customer: { select: { name: true } } }
      })
    ]);

    return {
      shortcuts,
      products,
      customers,
      suppliers,
      orders
    };
  } catch (error: any) {
    console.error("Global search error:", error);
    return { error: error.message };
  }
}
