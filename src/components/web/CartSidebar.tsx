"use client";

import { X, Trash2, Plus, Minus, Send } from "lucide-react";
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
        style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 100 }}
        onClick={closeCart}
      />
      
      {/* Sidebar */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "400px",
        backgroundColor: "white", zIndex: 101, display: "flex", flexDirection: "column",
        boxShadow: "-4px 0 15px rgba(0,0,0,0.1)", animation: "slideIn 0.3s ease-out forwards"
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>Tu Carrito</h2>
          <button onClick={closeCart} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--color-text-muted)", marginTop: "2rem" }}>
              Tu carrito está vacío.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ width: "60px", height: "60px", backgroundColor: "var(--color-background)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  📦
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.2, marginBottom: "0.5rem" }}>{item.name}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>${(item.price * item.quantity).toLocaleString('de-DE')}</span>
                    
                    {/* Quantity Controls */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "1px solid var(--color-border)", borderRadius: "9999px", padding: "0.25rem 0.5rem" }}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, width: "20px", textAlign: "center" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2 }}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)", padding: "0.5rem" }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout */}
        {items.length > 0 && (
          <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-border)", backgroundColor: "var(--color-background)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", fontSize: "1.1rem" }}>
              <span style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>Total Estimado:</span>
              <span style={{ fontWeight: 800, color: "var(--color-primary)" }}>${totalPrice.toLocaleString('de-DE')}</span>
            </div>
            <button 
              onClick={handleWhatsAppCheckout}
              className="btn" 
              style={{ width: "100%", padding: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", fontSize: "1.1rem", backgroundColor: "#25D366", color: "white" }}
            >
              <Send size={20} />
              Solicitar por WhatsApp
            </button>
            <p style={{ fontSize: "0.75rem", textAlign: "center", color: "var(--color-text-muted)", marginTop: "0.75rem", margin: "0.75rem 0 0 0" }}>
              Un asesor confirmará la disponibilidad y te indicará los pasos para el pago.
            </p>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}} />
    </>
  );
}
