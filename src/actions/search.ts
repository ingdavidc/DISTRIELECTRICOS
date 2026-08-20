"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { buildSearchTokenConditions } from "@/lib/searchUtils";

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
        where: buildSearchTokenConditions(searchStr, ['name', 'sku', 'commercialName', 'brand']) || {},
        take: 5,
        select: { id: true, name: true, sku: true, stock: true, price: true, imageUrl: true }
      }),
      prisma.customer.findMany({
        where: buildSearchTokenConditions(searchStr, ['name', 'identification', 'phone']) || {},
        take: 5,
        select: { id: true, name: true, identification: true, phone: true }
      }),
      prisma.supplier.findMany({
        where: buildSearchTokenConditions(searchStr, ['name', 'nit']) || {},
        take: 5,
        select: { id: true, name: true, nit: true }
      }),
      // Para órdenes, buscamos por ID, número de cotización o notas
      prisma.order.findMany({
        where: buildSearchTokenConditions(searchStr, ['id', 'quoteNumber', 'notes']) || {},
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

export async function searchProductsAutocomplete(query: string) {
  try {
    const q = query.slice(0, 100).trim();
    if (!q || q.length < 2) return [];

    const tokens = q.split(/\s+/).filter(Boolean);

    const tokenConditions = {
      AND: tokens.map((token) => ({
        OR: [
          { sku: { contains: token, mode: 'insensitive' } as any },
          { name: { contains: token, mode: 'insensitive' } as any },
          { brand: { contains: token, mode: 'insensitive' } as any },
        ],
      })),
    };

    const products = await prisma.product.findMany({
      where: tokenConditions,
      take: 8,
      select: {
        id: true,
        sku: true,
        name: true,
        price: true,
        stock: true,
        unit: true,
        imageUrl: true,
        cost: true,
        expertDiscount: true,
        volumeDiscount: true,
        corporateDiscount: true
      },
      orderBy: {
        stock: 'desc'
      }
    });

    return products;
  } catch (error) {
    console.error("Autocomplete search error:", error);
    return [];
  }
}
