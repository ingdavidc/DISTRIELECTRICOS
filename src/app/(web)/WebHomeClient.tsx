"use client";

import Link from "next/link";
import { Zap, Truck, ShieldCheck, Wrench, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/web/CartContext";
import { HalloweenBanner, HalloweenHeroBadge, HalloweenCornerSpiderweb } from "@/components/web/HalloweenSpecial";

export default function WebHomeClient({ config, gallery, products, promoProducts = [] }: { config: any, gallery: any[], products: any[], promoProducts?: any[] }) {
  const { addToCart } = useCart();

  const featuredCategories = [
    { name: "Conductores y Cables", img: "🔌", color: "#f39423", link: "/catalog?category=204a74cb-97b1-4554-9bee-4d5b71dfc000" },
    { name: "Iluminación Comercial", img: "💡", color: "#203562", link: "/catalog?category=11651069-bb4d-477b-9d77-afac5495b18f" },
    { name: "Automatización", img: "⚙️", color: "#b7b7c2", link: "/catalog?category=18811ae2-62ea-45c5-b410-fce91ff5d585" },
    { name: "Herramientas", img: "🛠️", color: "#10b981", link: "/catalog?category=f2b91dca-04e2-46b1-b422-f92ff367e2c5" },
  ];

  return (
    <div>
      {/* Aviso de Temporada de Halloween (Fácilmente desactivable) */}
      <HalloweenBanner />

      {/* Hero Section */}
      <section className="home-hero-section">
        {/* Decoración sutil de telaraña en esquina */}
        <HalloweenCornerSpiderweb />

        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 360px", maxWidth: "600px" }}>
            {/* Insignia especial de temporada */}
            <HalloweenHeroBadge />

            <h1 className="home-hero-title">
              {config.heroTitle}
            </h1>
            <p className="home-hero-subtitle">
              {config.heroSubtitle}
            </p>
            <div className="home-hero-buttons">
              <Link href="/catalog" className="btn btn-secondary btn-full-mobile" style={{ fontSize: "1rem", padding: "0.85rem 1.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", borderRadius: "9999px" }}>
                Ver Catálogo
                <ArrowRight size={18} />
              </Link>
              <Link href="/cotizar" className="btn btn-full-mobile" style={{ fontSize: "1rem", padding: "0.85rem 1.75rem", background: "white", color: "var(--color-primary)", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "9999px" }}>
                Cotizar Proyecto
              </Link>
            </div>
          </div>
          <div style={{ flex: "1 1 280px", display: "flex", justifyContent: "center" }}>
            {config.heroImageUrl ? (
               <img src={config.heroImageUrl} alt="Hero" style={{ width: "100%", maxWidth: "420px", borderRadius: "1rem", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }} />
            ) : (
              <div style={{ width: "280px", height: "280px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={80} color="var(--color-secondary)" opacity={0.5} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ background: "white", borderBottom: "1px solid var(--color-border)" }}>
        <div className="home-trust-badges-grid">
          {[
            { icon: ShieldCheck, title: "Garantía de Fábrica", text: "En todos los productos" },
            { icon: Truck, title: "Envíos Nacionales", text: "Seguros y rápidos" },
            { icon: Wrench, title: "Soporte Técnico", text: "Asesoría con Capi IA" },
            { icon: Zap, title: "Pagos Seguros", text: "Múltiples métodos" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--color-background)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{feature.title}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{feature.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories Grid */}
      <section className="home-section" style={{ background: "var(--color-background)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 className="home-section-title">Categorías Principales</h2>
          <div className="home-categories-grid">
            {featuredCategories.map((cat, i) => (
              <Link key={i} href={cat.link} style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card product-card" style={{ display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", padding: "1rem" }}>
                  <div style={{ fontSize: "2.2rem", flexShrink: 0 }}>{cat.img}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)" }}>{cat.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Day-to-Day Gallery (Carousel) */}
      <section className="home-section" style={{ background: "white" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 className="home-section-title">El Día a Día en DISTRIELECTRICOS</h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem", fontSize: "0.95rem" }}>Una mirada de nuestro trabajo en tienda y bodegas.</p>
          
          {(!gallery || gallery.length === 0) ? (
            <div style={{ display: "flex", overflowX: "auto", gap: "1rem", paddingBottom: "1rem" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ minWidth: "260px", height: "240px", borderRadius: "1rem", overflow: "hidden", background: "var(--color-background)", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--color-border)", color: "var(--color-text-muted)" }}>
                  <Zap size={36} style={{ opacity: 0.2, marginBottom: "0.75rem" }} />
                  <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>Próximamente</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="marquee-container">
              <div className="marquee-content">
                {[...gallery, ...gallery, ...gallery, ...gallery, ...gallery, ...gallery].map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="marquee-item" style={{ width: "280px", height: "240px", borderRadius: "1rem", overflow: "hidden", background: "#f0f0f0", flexShrink: 0, boxShadow: "0 8px 16px rgba(0,0,0,0.04)" }}>
                    {item.type === "VIDEO" ? (
                      <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} autoPlay muted loop playsInline />
                    ) : (
                      <img src={item.url} alt="Galería" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="home-section" style={{ background: "var(--color-background)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 className="home-section-title" style={{ marginBottom: 0 }}>Productos Destacados</h2>
            <Link href="/catalog" className="btn btn-outline" style={{ textDecoration: "none", fontSize: "0.85rem", padding: "0.45rem 1rem" }}>Ver Todo</Link>
          </div>
          
          <div className="catalog-product-grid">
            {products.map((prod) => (
              <div key={prod.id} className="card product-card catalog-product-card">
                <Link href={`/producto/${prod.id}`} className="product-img-wrapper catalog-img-wrapper">
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
                  <Link href={`/producto/${prod.id}`} className="catalog-product-name">{prod.name}</Link>
                  <div className="catalog-product-bottom-row">
                    <div className="catalog-product-price">${prod.price.toLocaleString('de-DE')}</div>
                    <button 
                      type="button"
                      className="btn btn-primary catalog-quick-add-btn" 
                      onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, brand: prod.brand, imageUrl: prod.imageUrl })}
                      aria-label="Agregar al carrito"
                    >
                      <ShoppingCart size={17} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Herramientas y Novedades Promocionadas */}
      {promoProducts && promoProducts.length > 0 && (
        <section className="home-section" style={{ background: "white", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 className="home-section-title" style={{ marginBottom: 0 }}>
                Herramientas y Novedades 🔥
              </h2>
            </div>
            
            <div className="catalog-product-grid">
              {promoProducts.map((prod) => (
                <div key={prod.id} className="card product-card catalog-product-card" style={{ border: "2px solid var(--color-secondary)" }}>
                  <Link href={`/producto/${prod.id}`} className="product-img-wrapper catalog-img-wrapper" style={{ position: "relative" }}>
                    <div style={{ position: "absolute", top: "8px", left: "8px", background: "var(--color-secondary)", color: "white", padding: "0.2rem 0.5rem", borderRadius: "1rem", fontSize: "0.7rem", fontWeight: 800, zIndex: 10 }}>
                      NUEVO
                    </div>
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} loading="lazy" />
                    ) : (
                      <Wrench size={40} color="var(--color-medium-gray)" />
                    )}
                  </Link>
                  <div className="catalog-product-info">
                    <div className="catalog-product-brand-row">
                      <span className="catalog-brand-name">{prod.brand || "Especial"}</span>
                    </div>
                    <Link href={`/producto/${prod.id}`} className="catalog-product-name">{prod.name}</Link>
                    <div className="catalog-product-bottom-row">
                      <div className="catalog-product-price">${prod.price.toLocaleString('de-DE')}</div>
                      <button 
                        type="button"
                        className="btn btn-secondary catalog-quick-add-btn" 
                        onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, brand: prod.brand, imageUrl: prod.imageUrl })}
                        aria-label="Agregar al carrito"
                      >
                        <ShoppingCart size={17} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
