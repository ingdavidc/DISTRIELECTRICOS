"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ShoppingCart, Filter, X, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useCart } from "@/components/web/CartContext";

export default function CatalogClient({
  products,
  categories,
  currentCategory: serverCategory, // unused, kept for prop signature
  currentQuery: serverQuery,
  currentMin,
  currentMax,
  currentPage,
  totalPages,
  totalCount,
  isFlash: serverFlash,
  flashOfferIds
}: {
  products: any[],
  categories: any[],
  currentCategory: string,
  currentQuery: string,
  currentMin?: number,
  currentMax?: number,
  currentPage: number,
  totalPages: number,
  totalCount: number,
  isFlash: boolean,
  flashOfferIds: string[]
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  
  const currentCategory = searchParams.get('category') || 'all';
  const currentQuery = searchParams.get('q') || '';
  const isFlash = searchParams.get('flash') === 'true';

  const [minPrice, setMinPrice] = useState(currentMin?.toString() || "");
  const [maxPrice, setMaxPrice] = useState(currentMax?.toString() || "");

  const getCategoryHref = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId && categoryId !== 'all') {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    params.delete('page');
    return `/catalog?${params.toString()}`;
  };

  const updateFilters = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Always reset to page 1 when changing filters
    params.delete('page');
    window.location.href = `/catalog?${params.toString()}`;
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (minPrice) params.set('minPrice', minPrice);
    else params.delete('minPrice');
    
    if (maxPrice) params.set('maxPrice', maxPrice);
    else params.delete('maxPrice');
    
    params.delete('page');
    window.location.href = `/catalog?${params.toString()}`;
  };

  const clearFilters = () => {
    window.location.href = '/catalog';
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    if (p === 1) params.delete('page');
    else params.set('page', p.toString());
    window.location.href = `/catalog?${params.toString()}`;
  };

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Page Header */}
      <div style={{ background: "white", borderBottom: "1px solid var(--color-border)", padding: "2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "1rem", alignItems: "center" }}>
          {isFlash && <Zap size={32} color="var(--color-secondary)" fill="var(--color-secondary)" />}
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
              {isFlash ? "Ofertas Flash" : "Catálogo de Productos"}
            </h1>
            {currentQuery && (
              <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                Resultados para: <strong style={{ color: "var(--color-secondary)" }}>"{currentQuery}"</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 2rem", display: "flex", gap: "2rem", alignItems: "flex-start" }}>
        {/* Sidebar Filters (Desktop) */}
        <aside style={{ width: "250px", flexShrink: 0, background: "white", padding: "1.5rem", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", gap: "2rem" }} className="hidden md:flex">
          <div>
            <h3 style={{ fontWeight: 600, marginBottom: "1rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Filter size={18} /> Categorías
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li>
                <Link 
                  href={getCategoryHref('all')}
                  style={{ display: "block", textDecoration: "none", color: currentCategory === 'all' ? "var(--color-secondary)" : "var(--color-text-main)", fontWeight: currentCategory === 'all' ? 700 : 500, width: "100%" }}
                >
                  Todas las Categorías
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={getCategoryHref(cat.id)}
                    style={{ display: "block", textDecoration: "none", color: currentCategory === cat.id ? "var(--color-secondary)" : "var(--color-text-main)", fontWeight: currentCategory === cat.id ? 700 : 500, width: "100%" }}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontWeight: 600, marginBottom: "1rem", color: "var(--color-primary)" }}>Precio</h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
              <input 
                type="number" 
                placeholder="Min" 
                className="input" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ padding: "0.5rem" }}
              />
              <span>-</span>
              <input 
                type="number" 
                placeholder="Max" 
                className="input" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ padding: "0.5rem" }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={applyPriceFilter}>
              Aplicar Precio
            </button>
          </div>

          {(currentQuery || currentCategory !== 'all' || currentMin || currentMax || isFlash) && (
            <button className="btn btn-outline" onClick={clearFilters} style={{ width: "100%" }}>
              Limpiar Filtros
            </button>
          )}
        </aside>

        {/* Product Grid */}
        <main style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <span style={{ color: "var(--color-text-muted)" }}>
              Mostrando {products.length} producto{products.length !== 1 && 's'}
            </span>
          </div>

          {products.length === 0 ? (
            <div style={{ background: "white", padding: "4rem", textAlign: "center", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
              <Search size={48} color="var(--color-medium-gray)" style={{ margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>No se encontraron productos</h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>
                Intenta con otros términos de búsqueda o quita algunos filtros.
              </p>
              <button className="btn btn-primary" onClick={clearFilters}>Ver Todos los Productos</button>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
                {products.map((prod) => (
                  <div key={prod.id} className="card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <div style={{ height: "200px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      {flashOfferIds.includes(prod.id) && (
                        <div style={{ position: "absolute", top: "10px", left: "10px", background: "var(--color-secondary)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <Zap size={12} fill="white" /> FLASH
                        </div>
                      )}
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "1rem" }} />
                      ) : (
                        <ShoppingCart size={60} color="var(--color-medium-gray)" />
                      )}
                    </div>
                    <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, background: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{prod.brand || "Sin Marca"}</div>
                        {prod.stock <= 0 ? (
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "1rem", background: "#fee2e2", color: "#ef4444" }}>Agotado</span>
                        ) : prod.stock <= 10 ? (
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "1rem", background: "#fef3c7", color: "#f59e0b" }}>Últimas unidades</span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, padding: "0.2rem 0.5rem", borderRadius: "1rem", background: "#dcfce7", color: "#22c55e" }}>Disponible</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "1rem", flex: 1 }}>{prod.name}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>${prod.price.toLocaleString()}</div>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: "0.5rem", borderRadius: "50%" }}
                          onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, brand: prod.brand })}
                        >
                          <ShoppingCart size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1rem", padding: "1rem" }}>
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-outline"
                    style={{ padding: "0.5rem", borderRadius: "50%" }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div style={{ fontWeight: 600, color: "var(--color-text-main)" }}>
                    Página {currentPage} de {totalPages}
                  </div>
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline"
                    style={{ padding: "0.5rem", borderRadius: "50%" }}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
