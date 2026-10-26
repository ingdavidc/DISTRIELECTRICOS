"use client";

import { X, Trash2, Plus, Minus, Send, ShoppingCart } from "lucide-react";
import { useCart } from "./CartContext";

export default function CartSidebar() {
  const { isCartOpen, closeCart, items, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (!isCartOpen) return null;

  const handleWhatsAppCheckout = () => {
    const phoneNumber = "573132239174";
    let message = "Hola, me gustaría verificar la disponibilidad y los medios de pago para el siguiente pedido:\n\n";
    
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.name} (x${item.quantity}) - $${(item.price * item.quantity).toLocaleString('de-DE')}\n`;
    });
    
    message += `\n*Total Estimado: $${totalPrice.toLocaleString('de-DE')}*`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)", zIndex: 1000 }}
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "400px",
        backgroundColor: "white", zIndex: 1001, display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 25px rgba(0,0,0,0.15)", animation: "slideInRight 0.25s ease-out forwards"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingCart size={20} color="var(--color-primary)" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>Tu Carrito</h2>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>({items.length})</span>
          </div>
          <button 
            type="button"
            onClick={closeCart} 
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "0.35rem" }}
            aria-label="Cerrar carrito"
          >
            <X size={22} />
          </button>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem", WebkitOverflowScrolling: "touch" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: "3rem" }}>
              <ShoppingCart size={48} color="var(--color-medium-gray)" style={{ margin: "0 auto 1rem auto" }} />
              <div style={{ fontWeight: 600, fontSize: "1rem", color: "var(--color-text-main)", marginBottom: "0.5rem" }}>Tu carrito está vacío</div>
              <p style={{ fontSize: "0.85rem" }}>Explora nuestro catálogo y agrega los productos que necesitas para tu proyecto.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: "0.85rem", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ width: "55px", height: "55px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }} />
                  ) : (
                    <span style={{ fontSize: "1.5rem" }}>📦</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.25, marginBottom: "0.35rem", wordBreak: "break-word", color: "var(--color-text-main)" }}>
                    {item.name}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>
                      ${(item.price * item.quantity).toLocaleString('de-DE')}
                    </span>
                    
                    {/* Quantity Controls */}
                    <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "9999px", background: "white" }}>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "30px" }}
                        aria-label="Restar unidad"
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, minWidth: "22px", textAlign: "center" }}>{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "30px" }}
                        aria-label="Sumar unidad"
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => removeFromCart(item.id)} 
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)", padding: "0.4rem", display: "flex", alignItems: "center" }}
                  aria-label="Eliminar producto"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div style={{ padding: "1.25rem 1.5rem", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.1rem" }}>
              <span style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>Total Estimado:</span>
              <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "1.25rem" }}>${totalPrice.toLocaleString('de-DE')}</span>
            </div>
            <button 
              type="button"
              onClick={handleWhatsAppCheckout}
              className="btn" 
              style={{ width: "100%", padding: "0.85rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", fontSize: "1.05rem", fontWeight: 700, backgroundColor: "#25D366", color: "white", borderRadius: "9999px" }}
            >
              <Send size={18} />
              Solicitar por WhatsApp
            </button>
            <p style={{ fontSize: "0.72rem", textAlign: "center", color: "var(--color-text-muted)", marginTop: "0.6rem", margin: "0.6rem 0 0 0" }}>
              Un asesor confirmará la disponibilidad y te indicará los pasos para el pago.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
