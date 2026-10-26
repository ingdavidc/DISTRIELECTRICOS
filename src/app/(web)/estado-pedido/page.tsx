"use client";

import { useState, useEffect, useRef } from "react";
import { trackOrder } from "@/actions/tracking";
import { Search, Package, Clock, CheckCircle, Truck, XCircle, ShoppingBag, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STEPS = [
  { id: "PENDING", label: "Aprobado", icon: CheckCircle },
  { id: "PREPARING", label: "En Preparación", icon: Package },
  { id: "READY_OR_DELIVERED", label: "Finalizado", icon: Truck },
];

export default function OrderTrackingPage() {
  const [ticketId, setTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 50);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) return;

    setIsLoading(true);
    setError(null);
    setOrderData(null);

    const res = await trackOrder(ticketId);
    
    if (res.success) {
      setOrderData(res.order);
      toast.success("¡Pedido encontrado!");
    } else {
      setError(res.error || "Error al buscar el pedido");
      toast.error(res.error || "Error al buscar el pedido");
    }

    setIsLoading(false);
  };

  const getStatusIndex = (status: string) => {
    switch (status) {
      case "PENDING":
      case "OPEN_INVOICE":
        return 0;
      case "PREPARING":
        return 1;
      case "READY":
      case "DELIVERED":
        return 2;
      case "CANCELLED":
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = orderData ? getStatusIndex(orderData.status) : 0;
  const isCancelled = orderData?.status === "CANCELLED";

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "clamp(2rem, 5vw, 4rem) 1rem", minHeight: "calc(100vh - 350px)", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "clamp(1.75rem, 5vw, 2.5rem)", fontWeight: 800, color: "var(--color-primary)", marginBottom: "0.75rem" }}>
          Rastrea tu Pedido
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
          Ingresa el número de ticket que aparece en tu comprobante de compra para conocer su estado actual.
        </p>
      </div>

      <form onSubmit={handleSearch} className="order-tracking-form">
        <div style={{ position: "relative", flex: 1, width: "100%" }}>
          <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Ej: 2634DA"
            value={ticketId}
            onChange={e => setTicketId(e.target.value)}
            style={{ width: "100%", padding: "0.85rem 1rem 0.85rem 2.85rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "1rem", outline: "none" }}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-secondary" 
          disabled={isLoading}
          style={{ padding: "0.85rem 1.75rem", minWidth: "140px", width: "auto" }}
        >
          {isLoading ? <Loader2 size={18} className="spin" /> : "Rastrear"}
        </button>
      </form>

      {error && (
        <div style={{ background: "#fef2f2", color: "#ef4444", padding: "1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", border: "1px solid #fca5a5", marginBottom: "2rem" }}>
          <XCircle size={40} />
          <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>Pedido no encontrado</h3>
          <p style={{ margin: 0, opacity: 0.8, fontSize: "0.9rem" }}>{error}</p>
        </div>
      )}

      {orderData && (
        <div className="card" style={{ padding: "clamp(1.5rem, 4vw, 3rem)", background: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                Hola, {orderData.customerName.split(" ")[0]}
              </h2>
              <p style={{ color: "var(--color-text-muted)", margin: "0.4rem 0 0 0", fontSize: "0.9rem" }}>
                Pedido: <strong>{orderData.id.split("-")[0].toUpperCase()}...</strong>
              </p>
            </div>
            <div style={{ textAlign: "right", background: "var(--color-background)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 700 }}>TIPO DE ENTREGA</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: "0.4rem", justifyContent: "flex-end", marginTop: "0.2rem" }}>
                {orderData.deliveryType === "RETIRO" ? <ShoppingBag size={16} /> : <Truck size={16} />}
                {orderData.deliveryType === "RETIRO" ? "Retiro en Tienda" : "Envío a Domicilio"}
              </div>
            </div>
          </div>

          {isCancelled ? (
            <div style={{ background: "#fef2f2", color: "#ef4444", padding: "1.5rem", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid #fca5a5", marginBottom: "2rem" }}>
              <XCircle size={40} style={{ margin: "0 auto 0.75rem auto" }} />
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Pedido Cancelado</h3>
              <p style={{ margin: "0.4rem 0 0 0", opacity: 0.8, fontSize: "0.9rem" }}>Este pedido ha sido cancelado.</p>
            </div>
          ) : (
            <div style={{ position: "relative", marginBottom: "3rem" }}>
              {/* Progress Line */}
              <div style={{ position: "absolute", top: "20px", left: "10%", right: "10%", height: "4px", background: "var(--color-border)", zIndex: 0, borderRadius: "2px" }}>
                <div style={{ 
                  height: "100%", 
                  background: "var(--color-secondary)", 
                  width: `${currentIndex === 0 ? 0 : currentIndex === 1 ? 50 : 100}%`,
                  transition: "width 0.5s ease-in-out",
                  borderRadius: "2px"
                }} />
              </div>

              {/* Steps */}
              <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                {STATUS_STEPS.map((step, index) => {
                  const isActive = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  let label = step.label;
                  if (index === 2) {
                    if (orderData.status === "DELIVERED") {
                      label = orderData.deliveryType === "RETIRO" ? "Entregado" : "Entregado";
                    } else {
                      label = orderData.deliveryType === "RETIRO" ? "Listo" : "En Ruta";
                    }
                  }

                  return (
                    <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "33%" }}>
                      <div style={{ 
                        width: "40px", 
                        height: "40px", 
                        borderRadius: "50%", 
                        background: isActive ? "var(--color-secondary)" : "white",
                        border: `3px solid ${isActive ? "var(--color-secondary)" : "var(--color-border)"}`,
                        color: isActive ? "white" : "var(--color-text-muted)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        marginBottom: "0.75rem",
                        transition: "all 0.3s ease",
                        boxShadow: isCurrent ? "0 0 0 6px rgba(251, 146, 60, 0.15)" : "none"
                      }}>
                        {isActive ? <CheckCircle size={20} /> : <Clock size={20} />}
                      </div>
                      <div style={{ fontWeight: 700, color: isActive ? "var(--color-primary)" : "var(--color-text-muted)", textAlign: "center", fontSize: "0.85rem" }}>
                        {label}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize: "0.72rem", color: "var(--color-secondary)", fontWeight: 700, marginTop: "0.2rem", textAlign: "center" }}>
                          Actual
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
            <p style={{ margin: "0 0 0.5rem 0" }}><strong>Artículos incluidos ({orderData.itemCount}):</strong></p>
            <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
              {orderData.sampleItems.map((item: string, i: number) => (
                <li key={i} style={{ marginBottom: "0.25rem" }}>{item}</li>
              ))}
              {orderData.itemCount > 2 && (
                <li>Y {orderData.itemCount - 2} artículo(s) más...</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
