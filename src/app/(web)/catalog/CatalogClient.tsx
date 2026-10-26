"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ShoppingCart, Filter, X, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useCart } from "@/components/web/CartContext";

export default function CatalogClient({
  products,
  categories,
  currentCategory: serverCategory,
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

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [searchParams]);

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

  const activeFilterCount = (currentCategory !== 'all' ? 1 : 0) + (currentMin || currentMax ? 1 : 0) + (isFlash ? 1 : 0);

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Page Header */}
      <div className="catalog-header-banner">
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "1rem", alignItems: "center" }}>
          {isFlash && <Zap size={32} color="var(--color-secondary)" fill="var(--color-secondary)" style={{ flexShrink: 0 }} />}
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-primary)", lineHeight: 1.2 }}>
              {isFlash ? "Ofertas Flash Especiales" : "Catálogo de Productos"}
            </h1>
            {currentQuery && (
              <p style={{ color: "var(--color-text-muted)", marginTop: "0.4rem", fontSize: "0.95rem" }}>
                Resultados para: <strong style={{ color: "var(--color-secondary)" }}>"{currentQuery}"</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="catalog-container">
        {/* Desktop Sidebar Filters */}
        <aside className="catalog-sidebar-desktop">
          <div>
            <h3 style={{ fontWeight: 700, marginBottom: "1rem", color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.05rem" }}>
              <Filter size={18} /> Categorías
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none" }}>
              <li>
                <Link 
                  href={getCategoryHref('all')}
                  style={{ display: "block", textDecoration: "none", color: currentCategory === 'all' ? "var(--color-secondary)" : "var(--color-text-main)", fontWeight: currentCategory === 'all' ? 700 : 500, width: "100%", fontSize: "0.92rem" }}
                >
                  Todas las Categorías
                </Link>
              </li>
              {categories.map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={getCategoryHref(cat.id)}
                    style={{ display: "block", textDecoration: "none", color: currentCategory === cat.id ? "var(--color-secondary)" : "var(--color-text-main)", fontWeight: currentCategory === cat.id ? 700 : 500, width: "100%", fontSize: "0.92rem" }}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 style={{ fontWeight: 700, marginBottom: "1rem", color: "var(--color-primary)", fontSize: "1.05rem" }}>Precio</h3>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
              <input 
                type="number" 
                placeholder="Min" 
                className="input" 
                value={minPrice} 
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ padding: "0.5rem", fontSize: "0.9rem" }}
              />
              <span>-</span>
              <input 
                type="number" 
                placeholder="Max" 
                className="input" 
                value={maxPrice} 
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ padding: "0.5rem", fontSize: "0.9rem" }}
              />
            </div>
            <button className="btn btn-primary" style={{ width: "100%", padding: "0.6rem" }} onClick={applyPriceFilter}>
              Aplicar Precio
            </button>
          </div>

          {(currentQuery || currentCategory !== 'all' || currentMin || currentMax || isFlash) && (
            <button className="btn btn-outline" onClick={clearFilters} style={{ width: "100%", padding: "0.6rem" }}>
              Limpiar Filtros
            </button>
          )}
        </aside>

        {/* Product Grid Area */}
        <main className="catalog-main-content">
          {/* Mobile Filter & Count Bar */}
          <div className="catalog-mobile-filter-bar">
            <button 
              type="button"
              onClick={() => setIsFiltersOpen(true)} 
              className="btn btn-outline catalog-filter-btn"
            >
              <Filter size={18} />
              <span>Filtros</span>
              {activeFilterCount > 0 && (
                <span style={{ background: "var(--color-secondary)", color: "white", padding: "0.15rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              {products.length} producto{products.length !== 1 && 's'}
            </span>
          </div>

          {/* Desktop Count Bar */}
          <div className="catalog-desktop-count-bar">
            <span style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              Mostrando {products.length} producto{products.length !== 1 && 's'}
            </span>
          </div>

          {products.length === 0 ? (
            <div style={{ background: "white", padding: "3rem 1.5rem", textAlign: "center", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)" }}>
              <Search size={48} color="var(--color-medium-gray)" style={{ margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>No se encontraron productos</h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
                Intenta con otros términos de búsqueda o quita los filtros aplicados.
              </p>
              <button className="btn btn-primary" onClick={clearFilters}>Ver Todos los Productos</button>
            </div>
          ) : (
            <>
              <div className="catalog-product-grid">
                {products.map((prod) => (
                  <div key={prod.id} className="card product-card catalog-product-card">
                    <Link href={`/producto/${prod.id}`} className="product-img-wrapper catalog-img-wrapper">
                      {flashOfferIds.includes(prod.id) && (
                        <div className="catalog-flash-badge">
                          <Zap size={11} fill="white" /> FLASH
                        </div>
                      )}
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} loading="lazy" />
                      ) : (
                        <ShoppingCart size={40} color="var(--color-medium-gray)" />
                      )}
                    </Link>
                    <div className="catalog-product-info">
                      <div className="catalog-product-brand-row">
                        <span className="catalog-brand-name">{prod.brand || "General"}</span>
                        {prod.stock <= 0 ? (
                          <span className="stock-badge stock-badge-out">Agotado</span>
                        ) : prod.stock <= 10 ? (
                          <span className="stock-badge stock-badge-low">Pocas un.</span>
                        ) : (
                          <span className="stock-badge stock-badge-in">Disponible</span>
                        )}
                      </div>
                      
                      <Link href={`/producto/${prod.id}`} className="catalog-product-name">
                        {prod.name}
                      </Link>
                      
                      <div className="catalog-product-bottom-row">
                        <div className="catalog-product-price">
                          ${prod.price.toLocaleString('de-DE')}
                        </div>
                        <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                          <button 
                            type="button"
                            className="btn btn-primary catalog-quick-add-btn"
                            onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, brand: prod.brand, imageUrl: prod.imageUrl })}
                            aria-label="Agregar al carrito"
                            title="Agregar al carrito"
                          >
                            <ShoppingCart size={17} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.75rem", padding: "2rem 0" }}>
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-outline"
                    style={{ padding: "0.5rem", borderRadius: "50%", minWidth: "40px", minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div style={{ fontWeight: 600, color: "var(--color-text-main)", fontSize: "0.9rem" }}>
                    Pág. {currentPage} de {totalPages}
                  </div>
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-outline"
                    style={{ padding: "0.5rem", borderRadius: "50%", minWidth: "40px", minHeight: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
                    aria-label="Página siguiente"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {isFiltersOpen && (
        <div className="mobile-filters-drawer-overlay" onClick={() => setIsFiltersOpen(false)}>
          <div className="mobile-filters-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Filter size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--color-primary)" }}>Filtros del Catálogo</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsFiltersOpen(false)}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", padding: "0.25rem" }}
                aria-label="Cerrar filtros"
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.5rem", padding: "1rem 0" }}>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-primary)", fontSize: "1rem" }}>Categorías</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <Link 
                    href={getCategoryHref('all')}
                    onClick={() => setIsFiltersOpen(false)}
                    style={{ 
                      padding: "0.6rem 0.8rem", 
                      borderRadius: "var(--radius-md)", 
                      background: currentCategory === 'all' ? "rgba(32, 53, 98, 0.08)" : "transparent",
                      color: currentCategory === 'all' ? "var(--color-secondary)" : "var(--color-text-main)",
                      fontWeight: currentCategory === 'all' ? 700 : 500,
                      textDecoration: "none",
                      fontSize: "0.95rem"
                    }}
                  >
                    Todas las Categorías
                  </Link>
                  {categories.map(cat => (
                    <Link 
                      key={cat.id}
                      href={getCategoryHref(cat.id)}
                      onClick={() => setIsFiltersOpen(false)}
                      style={{ 
                        padding: "0.6rem 0.8rem", 
                        borderRadius: "var(--radius-md)", 
                        background: currentCategory === cat.id ? "rgba(32, 53, 98, 0.08)" : "transparent",
                        color: currentCategory === cat.id ? "var(--color-secondary)" : "var(--color-text-main)",
                        fontWeight: currentCategory === cat.id ? 700 : 500,
                        textDecoration: "none",
                        fontSize: "0.95rem"
                      }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontWeight: 700, marginBottom: "0.75rem", color: "var(--color-primary)", fontSize: "1rem" }}>Rango de Precio</h4>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.75rem" }}>
                  <input 
                    type="number" 
                    placeholder="Mínimo" 
                    className="input" 
                    value={minPrice} 
                    onChange={(e) => setMinPrice(e.target.value)}
                    style={{ padding: "0.6rem" }}
                  />
                  <span>-</span>
                  <input 
                    type="number" 
                    placeholder="Máximo" 
                    className="input" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(e.target.value)}
                    style={{ padding: "0.6rem" }}
                  />
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: "100%", padding: "0.75rem" }} 
                  onClick={() => { setIsFiltersOpen(false); applyPriceFilter(); }}
                >
                  Aplicar Precio
                </button>
              </div>
            </div>

            <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--color-border)", display: "flex", gap: "0.75rem" }}>
              <button 
                className="btn btn-outline" 
                onClick={() => { setIsFiltersOpen(false); clearFilters(); }} 
                style={{ flex: 1, padding: "0.75rem" }}
              >
                Limpiar Todo
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setIsFiltersOpen(false)} 
                style={{ flex: 1, padding: "0.75rem" }}
              >
                Ver Resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
