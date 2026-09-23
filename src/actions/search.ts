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

    // 1. Intentar búsqueda estricta (TODAS las palabras deben coincidir)
    const strictConditions = {
      AND: tokens.map((token) => ({
        OR: [
          { sku: { contains: token, mode: 'insensitive' } as any },
          { name: { contains: token, mode: 'insensitive' } as any },
          { brand: { contains: token, mode: 'insensitive' } as any },
        ],
      })),
    };

    const selectFields = {
      id: true, sku: true, name: true, price: true, stock: true, 
      unit: true, imageUrl: true, cost: true, expertDiscount: true, 
      volumeDiscount: true, corporateDiscount: true, brand: true
    };

    let products = await prisma.product.findMany({
      where: strictConditions,
      take: 8,
      select: selectFields,
      orderBy: { stock: 'desc' }
    });

    // 2. Si no hay suficientes resultados, hacer búsqueda flexible (AL MENOS UNA palabra)
    if (products.length < 4 && tokens.length > 1) {
      const flexibleConditions = {
        OR: tokens.map((token) => ({
          OR: [
            { sku: { contains: token, mode: 'insensitive' } as any },
            { name: { contains: token, mode: 'insensitive' } as any },
            { brand: { contains: token, mode: 'insensitive' } as any },
          ],
        })),
      };

      const flexibleProducts = await prisma.product.findMany({
        where: flexibleConditions,
        take: 300, // Aumentamos para no dejar por fuera resultados si hay muchos de una sola palabra
        select: selectFields,
        orderBy: { stock: 'desc' } // Priorizar los que tienen stock desde la base de datos
      });

      // Puntuar los resultados flexibles
      const scoredProducts = flexibleProducts.map(p => {
        const lowerName = p.name.toLowerCase();
        const textToSearch = `${lowerName} ${p.sku} ${p.brand || ''}`.toLowerCase();
        let score = 0;
        
        tokens.forEach((token, index) => {
          const lowerToken = token.toLowerCase();
          if (textToSearch.includes(lowerToken)) {
            score += 1; // Coincidencia básica
            
            // Puntos extra si el nombre EMPIEZA con esta palabra (ej: SPOT)
            if (lowerName.startsWith(lowerToken)) {
              score += 3;
            }
            
            // Puntos extra si es una palabra exacta (separada por espacios), no parte de otra palabra
            const isExactWord = new RegExp(`\\b${lowerToken}\\b`).test(lowerName);
            if (isExactWord) {
              score += 1.5;
            }
            
            // Puntos extra a la última palabra escrita, suele ser el filtro principal
            if (index === tokens.length - 1) {
              score += 0.5;
            }
          }
        });
        
        // Dar peso extra si está en stock
        if (p.stock > 0) score += 2;
        
        return { product: p, score };
      });

      // Ordenar por puntaje (mayor a menor)
      scoredProducts.sort((a, b) => b.score - a.score);

      // Mezclar evitando duplicados
      const existingIds = new Set(products.map(p => p.id));
      for (const item of scoredProducts) {
        if (!existingIds.has(item.product.id)) {
          products.push(item.product);
          existingIds.add(item.product.id);
        }
        if (products.length >= 8) break;
      }
    }

    return products;
  } catch (error) {
    console.error("Autocomplete search error:", error);
    return [];
  }
}
