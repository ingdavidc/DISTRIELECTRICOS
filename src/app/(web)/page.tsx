"use client";

import Image from "next/image";
import { Zap, Truck, ShieldCheck, Wrench, ArrowRight, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/web/CartContext";

export default function WebHomePage() {
  const { addToCart } = useCart();

  const featuredCategories = [
    { name: "Conductores y Cables", img: "🔌", color: "#f39423" },
    { name: "Iluminación Comercial", img: "💡", color: "#203562" },
    { name: "Automatización", img: "⚙️", color: "#b7b7c2" },
    { name: "Herramientas", img: "🛠️", color: "#10b981" },
  ];

  const featuredProducts = [
    { id: 1, name: "Cable THHN 12 AWG Centelsa (Rollo x 100m)", price: "245.000", brand: "Centelsa", tag: "Más Vendido" },
    { id: 2, name: "Interruptor Termomagnético 2x20A", price: "45.000", brand: "Schneider Electric", tag: "Oferta" },
    { id: 3, name: "Panel LED 60x60 40W Luz Blanca", price: "85.000", brand: "Sylvania", tag: null },
    { id: 4, name: "Contactor Tripolar 32A 110V", price: "125.000", brand: "Siemens", tag: null },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section style={{ 
        background: "linear-gradient(135deg, var(--color-primary) 0%, #172646 100%)", 
        color: "white", padding: "6rem 2rem", position: "relative", overflow: "hidden" 
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 10, display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, maxWidth: "600px" }}>
            <h1 style={{ fontSize: "3.5rem", fontWeight: 800, lineHeight: 1.1, marginBottom: "1.5rem" }}>
              Todo el Material Eléctrico para tus <span style={{ color: "var(--color-secondary)" }}>Grandes Proyectos</span>
            </h1>
            <p style={{ fontSize: "1.2rem", color: "var(--color-light-gray)", marginBottom: "2.5rem", lineHeight: 1.6 }}>
              Encuentra marcas líderes mundiales, disponibilidad de inventario en tiempo real y asesoría experta. Compra en línea y recoge en tienda en 2 horas.
            </p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-secondary" style={{ fontSize: "1.1rem", padding: "1rem 2rem" }}>
                Ver Catálogo
                <ArrowRight size={20} />
              </button>
              <button className="btn" style={{ fontSize: "1.1rem", padding: "1rem 2rem", background: "white", color: "var(--color-primary)", fontWeight: 600 }}>
                Cotizar Proyecto
              </button>
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            {/* Hero Graphic Placeholder */}
            <div style={{ width: "400px", height: "400px", background: "rgba(255,255,255,0.05)", borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Zap size={100} color="var(--color-secondary)" opacity={0.5} />
            </div>
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

      {/* Featured Products */}
      <section style={{ background: "white", padding: "5rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>Productos Destacados</h2>
            <button className="btn btn-outline">Ver Todo</button>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "2rem" }}>
            {featuredProducts.map((prod) => (
              <div key={prod.id} className="card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ height: "200px", background: "var(--color-background)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <Package size={60} color="var(--color-medium-gray)" />
                  {prod.tag && (
                    <div style={{ position: "absolute", top: "10px", right: "10px", background: prod.tag === 'Oferta' ? 'var(--color-danger)' : 'var(--color-secondary)', color: "white", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 700 }}>
                      {prod.tag}
                    </div>
                  )}
                </div>
                <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>{prod.brand}</div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "1rem", flex: 1 }}>{prod.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)" }}>${prod.price}</div>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: "0.5rem", borderRadius: "50%" }}
                      onClick={() => addToCart({ id: prod.id, name: prod.name, price: parseInt(prod.price.replace(".", "")), brand: prod.brand })}
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
    </div>
  );
}

// Icon placeholder for products
const Package = ({ size, color }: { size: number, color: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
  </svg>
);
