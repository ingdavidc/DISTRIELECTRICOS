"use client";

import Link from "next/link";
import { Zap, Truck, ShieldCheck, Wrench, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/web/CartContext";

export default function WebHomeClient({ config, gallery, products, promoProducts = [] }: { config: any, gallery: any[], products: any[], promoProducts?: any[] }) {
  const { addToCart } = useCart();

  const featuredCategories = [
    { name: "Conductores y Cables", img: "🔌", color: "#f39423" },
    { name: "Iluminación Comercial", img: "💡", color: "#203562" },
    { name: "Automatización", img: "⚙️", color: "#b7b7c2" },
    { name: "Herramientas", img: "🛠️", color: "#10b981" },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        background: "linear-gradient(135deg, var(--color-primary) 0%, #172646 100%)", 
        color: "white", padding: "6rem 2rem", position: "relative", overflow: "hidden" 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 500px", maxWidth: "600px" }}>
            <h1 style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.5rem" }}>
              {config.heroTitle}
            </h1>
            <p style={{ fontSize: "1.2rem", color: "var(--color-light-gray)", marginBottom: "2.5rem", lineHeight: 1.6 }}>
              {config.heroSubtitle}
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <Link href="/catalog" className="btn btn-secondary" style={{ fontSize: "1.1rem", padding: "1rem 2rem", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                Ver Catálogo
                <ArrowRight size={20} />
              </Link>
              <Link href="/cotizar" className="btn" style={{ fontSize: "1.1rem", padding: "1rem 2rem", background: "white", color: "var(--color-primary)", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
                Cotizar Proyecto
              </Link>
            </div>
          </div>
          <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "flex-end" }}>
            {config.heroImageUrl ? (
               <img src={config.heroImageUrl} alt="Hero" style={{ width: "100%", maxWidth: "450px", borderRadius: "1rem", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }} />
            ) : (
              <div style={{ width: "400px", height: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Zap size={100} color="var(--color-secondary)" opacity={0.5} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section style={{ background: "white", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2rem" }}>
          {[
            { icon: ShieldCheck, title: "Garantía de Fábrica", text: "En todos los productos" },
            { icon: Truck, title: "Envíos Nacionales", text: "Gratis por compras > $200k" },
            { icon: Wrench, title: "Soporte Técnico", text: "Asesoría con Capi IA" },
            { icon: Zap, title: "Pagos Seguros", text: "Múltiples métodos de pago" },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "var(--color-background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={24} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700 }}>{feature.title}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>{feature.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories Grid */}
      <section style={{ background: "var(--color-background)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "2rem", color: "var(--color-primary)" }}>Categorías Principales</h2>
          <div className="grid-cards">
            {featuredCategories.map((cat, i) => (
              <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ fontSize: "3rem" }}>{cat.img}</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>{cat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Day-to-Day Gallery (Carousel) */}
      <section style={{ background: "white", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary)" }}>El Día a Día en DISTRIELECTRICOS</h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>Una mirada detrás de escena de nuestro trabajo en tienda y bodegas.</p>
          
          <div style={{ display: "flex", overflowX: "auto", gap: "1rem", paddingBottom: "1rem", scrollSnapType: "x mandatory" }}>
            {gallery && gallery.length > 0 ? (
              gallery.map(item => (
                <div key={item.id} style={{ minWidth: "300px", height: "300px", borderRadius: "1rem", overflow: "hidden", scrollSnapAlign: "start", background: "#f0f0f0", flexShrink: 0, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
                  {item.type === "VIDEO" ? (
                    <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls muted loop />
                  ) : (
                    <img src={item.url} alt="Galería" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
              ))
            ) : (
              // Empty State Placeholder
              [1, 2, 3].map(i => (
                <div key={i} style={{ minWidth: "300px", height: "300px", borderRadius: "1rem", overflow: "hidden", scrollSnapAlign: "start", background: "var(--color-background)", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "2px dashed var(--color-border)", color: "var(--color-text-muted)" }}>
                  <Zap size={40} style={{ opacity: 0.2, marginBottom: "1rem" }} />
                  <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>Próximamente</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ background: "var(--color-background)", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>Productos Destacados</h2>
            <button className="btn btn-outline">Ver Todo</button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "2rem" }}>
            {products.map((prod) => (
              <div key={prod.id} className="card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: "200px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
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
        </div>
      </section>
      {/* Herramientas y Novedades Promocionadas */}
      {promoProducts && promoProducts.length > 0 && (
        <section style={{ background: "white", padding: "5rem 2rem", borderTop: "1px solid var(--color-border)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>
                Herramientas y Novedades 🔥
              </h2>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {promoProducts.map((prod) => (
                <div key={prod.id} className="card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", border: "2px solid var(--color-secondary)", position: "relative" }}>
                  <div style={{ position: "absolute", top: "1rem", left: "1rem", background: "var(--color-secondary)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: 800, zIndex: 10 }}>
                    NUEVO
                  </div>
                  <div style={{ height: "250px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                    {prod.imageUrl ? (
                      <img src={prod.imageUrl} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "contain", transition: "transform 0.3s" }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} />
                    ) : (
                      <Wrench size={80} color="var(--color-medium-gray)" />
                    )}
                  </div>
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, background: "linear-gradient(to bottom, #ffffff, #f8fafc)" }}>
                    <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "0.5rem", fontWeight: 600 }}>{prod.brand || "Especial"}</div>
                    <div style={{ fontWeight: 800, fontSize: "1.3rem", marginBottom: "0.5rem", color: "var(--color-text-main)", lineHeight: 1.2 }}>{prod.name}</div>
                    <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", marginBottom: "1.5rem", flex: 1 }}>
                      {prod.description || "Equipamiento profesional de alto rendimiento para proyectos eléctricos de cualquier magnitud."}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "auto" }}>
                      <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-primary)" }}>${prod.price.toLocaleString()}</div>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: "0.75rem 1.5rem", borderRadius: "2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
                        onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, brand: prod.brand })}
                      >
                        Comprar <ArrowRight size={18} />
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
