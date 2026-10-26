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
  const allImages: string[] = [];
  if (product.imageUrl) allImages.push(product.imageUrl);
  if (product.imageUrls && product.imageUrls.length > 0) {
    product.imageUrls.forEach((img: string) => {
      if (img !== product.imageUrl && !allImages.includes(img)) allImages.push(img);
    });
  }
  
  const [mainImage, setMainImage] = useState(allImages.length > 0 ? allImages[0] : null);

  const handleAddToCart = () => {
    addToCart({ 
      id: product.id, 
      name: product.name, 
      price: product.price, 
      brand: product.brand,
      imageUrl: product.imageUrl 
    }, quantity);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", paddingBottom: "5rem" }}>
      {/* Breadcrumb */}
      <div className="product-detail-breadcrumb">
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--color-text-muted)", overflowX: "auto", whiteSpace: "nowrap" }}>
          <Link href="/" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Inicio</Link>
          <ChevronRight size={13} style={{ flexShrink: 0 }} />
          <Link href="/catalog" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>Catálogo</Link>
          <ChevronRight size={13} style={{ flexShrink: 0 }} />
          <span style={{ color: "var(--color-text-main)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</span>
        </div>
      </div>

      <div className="product-detail-page-container">
        <Link href="/catalog" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "1.25rem", fontWeight: 600, fontSize: "0.9rem" }}>
          <ArrowLeft size={16} /> Volver al catálogo
        </Link>

        {/* Product Section Card */}
        <div className="product-detail-card">
          
          {/* Left Column: Gallery */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="product-detail-main-img-box">
              {mainImage ? (
                <img src={mainImage} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              ) : (
                <ShoppingCart size={80} color="var(--color-medium-gray)" />
              )}
            </div>
            
            {allImages.length > 1 && (
              <div style={{ display: "flex", gap: "0.6rem", overflowX: "auto", paddingBottom: "0.5rem", WebkitOverflowScrolling: "touch" }}>
                {allImages.map((img, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    onClick={() => setMainImage(img)}
                    style={{ 
                      width: "68px", 
                      height: "68px", 
                      borderRadius: "0.5rem", 
                      border: mainImage === img ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      cursor: "pointer",
                      padding: "0.35rem",
                      background: "white",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      outline: "none"
                    }}
                  >
                    <img src={img} alt={`Thumb ${idx}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Info & Actions */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              {product.brand && (
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--color-primary)", background: "var(--color-background)", padding: "0.2rem 0.6rem", borderRadius: "1rem", textTransform: "uppercase" }}>
                  {product.brand}
                </span>
              )}
              <span style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>SKU: {product.sku}</span>
            </div>

            <h1 className="product-detail-title">
              {product.name}
            </h1>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.85rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
              <div className="product-detail-price">
                ${product.price.toLocaleString('de-DE')}
              </div>
              {product.originalPrice && (
                <div style={{ fontSize: "1.1rem", textDecoration: "line-through", color: "var(--color-text-muted)" }}>
                  ${product.originalPrice.toLocaleString('de-DE')}
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              {product.description || "Producto de alta calidad garantizado por DISTRIELECTRICOS E&D. Especializado para aplicaciones eléctricas y de construcción."}
            </div>

            {product.features && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--color-primary)" }}>Características Principales</h3>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{product.features}</div>
              </div>
            )}

            {/* Actions / Purchase Box */}
            <div className="product-detail-action-box">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Disponibilidad:</div>
                {product.stock <= 0 ? (
                  <span style={{ fontWeight: 700, color: "#ef4444", background: "#fee2e2", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.8rem" }}>Agotado</span>
                ) : product.stock <= 10 ? (
                  <span style={{ fontWeight: 700, color: "#f59e0b", background: "#fef3c7", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.8rem" }}>Últimas {product.stock} unidades</span>
                ) : (
                  <span style={{ fontWeight: 700, color: "#22c55e", background: "#dcfce7", padding: "0.25rem 0.75rem", borderRadius: "1rem", fontSize: "0.8rem" }}>En Stock</span>
                )}
              </div>

              {product.stock > 0 && (
                <div className="product-detail-cta-row">
                  <div className="product-qty-selector">
                    <button 
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      aria-label="Disminuir cantidad"
                    >-</button>
                    <div className="qty-number">{quantity}</div>
                    <button 
                      type="button"
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                      aria-label="Aumentar cantidad"
                    >+</button>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleAddToCart}
                    disabled={added}
                    className="btn btn-primary product-add-cart-btn"
                    style={{ background: added ? "#10b981" : "var(--color-primary)" }}
                  >
                    {added ? (
                      <><Check size={20} /> ¡Agregado al Carrito!</>
                    ) : (
                      <><ShoppingCart size={20} /> Añadir al Carrito</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Ficha Tecnica & Trust */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {product.technicalSheetUrl && (
                <a 
                  href={product.technicalSheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="product-datasheet-link"
                >
                  <FileText size={18} color="var(--color-primary)" /> 
                  <span>Descargar Ficha Técnica PDF</span>
                </a>
              )}
              
              <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  <ShieldCheck size={18} color="var(--color-primary)" /> Garantía oficial
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  <Truck size={18} color="var(--color-primary)" /> Envíos a todo el país
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <div style={{ marginTop: "3.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "1.5rem" }}>
              Productos Relacionados
            </h2>
            <div className="catalog-product-grid">
              {similarProducts.map((prod) => (
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
                      <span className="catalog-brand-name">{prod.brand || "Distribución"}</span>
                    </div>
                    <Link href={`/producto/${prod.id}`} className="catalog-product-name">
                      {prod.name}
                    </Link>
                    <div className="catalog-product-bottom-row">
                      <div className="catalog-product-price">
                        ${prod.price.toLocaleString('de-DE')}
                      </div>
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
        )}

      </div>
    </div>
  );
}
