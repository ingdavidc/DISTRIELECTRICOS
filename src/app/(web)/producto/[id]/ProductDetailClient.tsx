"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, FileText, Check, ChevronRight } from "lucide-react";
import { useCart } from "@/components/web/CartContext";

export default function ProductDetailClient({ product, similarProducts }: { product: any, similarProducts: any[] }) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  
  // Combine single image and multiple images for the gallery
  const allImages = [];
  if (product.imageUrl) allImages.push(product.imageUrl);
  if (product.imageUrls && product.imageUrls.length > 0) {
    product.imageUrls.forEach((img: string) => {
      if (img !== product.imageUrl) allImages.push(img);
    });
  }
  
  const [mainImage, setMainImage] = useState(allImages.length > 0 ? allImages[0] : null);

  const handleAddToCart = () => {
    addToCart({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      brand: product.brand 
    }, quantity);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: "5rem" }}>
      {/* Breadcrumb */}
      <div style={{ background: "white", borderBottom: "1px solid var(--color-border)", padding: "1rem 2rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          <Link href="/" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={14} />
          <Link href="/catalog" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Catálogo</Link>
          <ChevronRight size={14} />
          <span style={{ color: "var(--color-text-main)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</span>
        </div>
      </div>

      <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 2rem" }}>
        
        <Link href="/catalog" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "2rem", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Volver al catálogo
        </Link>

        {/* Product Section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "3rem", background: "white", padding: "3rem", borderRadius: "1.5rem", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
          
          {/* Left Column: Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ width: "100%", aspectRatio: "1/1", borderRadius: "1rem", overflow: "hidden", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "2rem" }}>
              {mainImage ? (
                <img src={mainImage} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <ShoppingCart size={100} color="var(--color-medium-gray)" />
              )}
            </div>
            
            {allImages.length > 1 && (
              <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                {allImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setMainImage(img)}
                    style={{ 
                      width: "80px", 
                      height: "80px", 
                      borderRadius: "0.5rem", 
                      border: mainImage === img ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      cursor: "pointer",
                      padding: "0.5rem",
                      background: "white",
                      flexShrink: 0
                    }}
                  >
                    <img src={img} alt={`Thumb ${idx}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
              {product.brand && <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-primary)", background: "var(--color-background)", padding: "0.25rem 0.75rem", borderRadius: "1rem", textTransform: "uppercase" }}>{product.brand}</span>}
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>SKU: {product.sku}</span>
            </div>

            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-text-main)", lineHeight: 1.2, marginBottom: "1rem" }}>
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)" }}>
                ${product.price.toLocaleString()}
              </div>
              {product.originalPrice && (
                <div style={{ fontSize: "1.2rem", textDecoration: "line-through", color: "var(--color-text-muted)" }}>
                  ${product.originalPrice.toLocaleString()}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ fontSize: "1rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "2rem" }}>
              {product.description || "Producto de alta calidad garantizado por DISTRIELECTRICOS. Especializado para aplicaciones eléctricas y ferreteras."}
            </div>

            {product.features && (
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Características o Descripción Adicional</h3>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{product.features}</div>
              </div>
            )}

            {/* Actions */}
            <div style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "1rem", marginBottom: "2rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600 }}>Disponibilidad:</div>
                {product.stock <= 0 ? (
                  <span style={{ fontWeight: 700, color: "#ef4444", background: "#fee2e2", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.85rem" }}>Agotado</span>
                ) : product.stock <= 10 ? (
                  <span style={{ fontWeight: 700, color: "#f59e0b", background: "#fef3c7", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.85rem" }}>Últimas {product.stock} unidades</span>
                ) : (
                  <span style={{ fontWeight: 700, color: "#22c55e", background: "#dcfce7", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.85rem" }}>En Stock</span>
                )}
              </div>

              {product.stock > 0 && (
                <div style={{ display: "flex", gap: "1rem", alignItems: "stretch" }}>
                  <div style={{ display: "flex", alignItems: "center", background: "white", border: "1px solid var(--color-border)", borderRadius: "0.5rem", overflow: "hidden" }}>
                    <button 
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      style={{ padding: "0.75rem 1rem", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >-</button>
                    <div style={{ width: "40px", textAlign: "center", fontWeight: 600 }}>{quantity}</div>
                    <button 
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      style={{ padding: "0.75rem 1rem", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >+</button>
                  </div>
                  <button 
                    onClick={handleAddToCart}
                    disabled={added}
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: added ? "#10b981" : "var(--color-primary)", color: "white", border: "none", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
                  >
                    {added ? (
                      <><Check size={20} /> ¡Agregado!</>
                    ) : (
                      <><ShoppingCart size={20} /> Añadir al Carrito</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Ficha Tecnica & Trust */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {product.technicalSheetUrl && (
                <a 
                  href={product.technicalSheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "0.5rem", textDecoration: "none", color: "var(--color-text-main)", fontWeight: 600, transition: "background 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <FileText size={20} color="var(--color-primary)" /> Descargar Ficha Técnica
                </a>
              )}
              
              <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                  <ShieldCheck size={18} color="var(--color-primary)" /> Garantía de fábrica
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                  <Truck size={18} color="var(--color-primary)" /> Envíos nacionales
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <div style={{ marginTop: "5rem" }}>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "2rem" }}>Productos Similares</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "2rem" }}>
              {similarProducts.map((prod) => (
                <div key={prod.id} className="card product-card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <Link href={`/producto/${prod.id}`} style={{ display: "block", textDecoration: "none" }}>
                    <div style={{ height: "200px", background: "white", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
                      {prod.imageUrl ? (
                        <img src={prod.imageUrl} alt={prod.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      ) : (
                        <ShoppingCart size={50} color="var(--color-medium-gray)" />
                      )}
                    </div>
                  </Link>
                  <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", flex: 1, background: "white", borderTop: "1px solid var(--color-border)" }}>
                    <Link href={`/producto/${prod.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>{prod.brand || "Distribución"}</div>
                      <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "1rem", lineHeight: 1.3 }}>{prod.name}</div>
                    </Link>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-primary)" }}>${prod.price.toLocaleString()}</div>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: "0.5rem", borderRadius: "50%" }}
                        onClick={() => addToCart({ id: prod.id, name: prod.name, price: prod.price, brand: prod.brand })}
                      >
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
