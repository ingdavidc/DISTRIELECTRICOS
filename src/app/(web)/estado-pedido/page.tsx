"use client";

import { useState } from "react";
import { trackOrder } from "@/actions/tracking";
import { Search, Package, Clock, CheckCircle, Truck, XCircle, ShoppingBag, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STEPS = [
  { id: "PENDING", label: "Aprobado", icon: CheckCircle },
  { id: "PREPARING", label: "En Preparación", icon: Package },
  { id: "READY_OR_DELIVERED", label: "Finalizado", icon: Truck }, // Generic last step
];

export default function OrderTrackingPage() {
  const [ticketId, setTicketId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div style={{ maxWidth: "800px", margin: "4rem auto", padding: "0 2rem", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "1rem" }}>
          Rastrea tu Pedido
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Ingresa el número de ticket (UUID) que aparece en tu comprobante de compra para conocer en qué etapa se encuentra.
        </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: "1rem", marginBottom: "3rem", background: "white", padding: "1rem", borderRadius: "1rem", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            placeholder="Ej: 123e4567-e89b-12d3-a456-426614174000"
            value={ticketId}
            onChange={e => setTicketId(e.target.value)}
            style={{ width: "100%", padding: "1rem 1rem 1rem 3rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", fontSize: "1rem", outline: "none" }}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-secondary" 
          disabled={isLoading}
          style={{ padding: "0 2rem", minWidth: "150px" }}
        >
          {isLoading ? <Loader2 size={20} className="spin" /> : "Rastrear"}
        </button>
      </form>

      {error && (
        <div style={{ background: "#fef2f2", color: "#ef4444", padding: "2rem", borderRadius: "var(--radius-md)", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", border: "1px solid #fca5a5" }}>
          <XCircle size={48} />
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Pedido no encontrado</h3>
          <p style={{ margin: 0, opacity: 0.8 }}>{error}</p>
        </div>
      )}

      {orderData && (
        <div className="card" style={{ padding: "3rem 2rem", background: "white" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "3rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
                Hola, {orderData.customerName.split(" ")[0]}
              </h2>
              <p style={{ color: "var(--color-text-muted)", margin: "0.5rem 0 0 0" }}>
                Pedido: <strong>{orderData.id.split("-")[0].toUpperCase()}...</strong>
              </p>
            </div>
            <div style={{ textAlign: "right", background: "var(--color-background-alt)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>TIPO DE ENTREGA</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                {orderData.deliveryType === "RETIRO" ? <ShoppingBag size={18} /> : <Truck size={18} />}
                {orderData.deliveryType === "RETIRO" ? "Retiro en Tienda" : "Envío a Domicilio"}
              </div>
            </div>
          </div>

          {isCancelled ? (
            <div style={{ background: "#fef2f2", color: "#ef4444", padding: "2rem", borderRadius: "var(--radius-md)", textAlign: "center", border: "1px solid #fca5a5", marginBottom: "2rem" }}>
              <XCircle size={48} style={{ margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Pedido Cancelado</h3>
              <p style={{ margin: "0.5rem 0 0 0", opacity: 0.8 }}>Este pedido ha sido anulado y ya no se encuentra en preparación.</p>
            </div>
          ) : (
            <div style={{ position: "relative", marginBottom: "4rem" }}>
              {/* Progress Line */}
              <div style={{ position: "absolute", top: "24px", left: "10%", right: "10%", height: "4px", background: "var(--color-border)", zIndex: 0, borderRadius: "2px" }}>
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
                  const Icon = step.icon;
                  const isActive = index <= currentIndex;
                  const isCurrent = index === currentIndex;

                  // Customize the last step label based on delivery type
                  let label = step.label;
                  if (index === 2) {
                    if (orderData.status === "DELIVERED") {
                      label = orderData.deliveryType === "RETIRO" ? "Entregado en Tienda" : "Entregado a Domicilio";
                    } else {
                      label = orderData.deliveryType === "RETIRO" ? "Listo para Recoger" : "En Ruta / Salió";
                    }
                  }

                  return (
                    <div key={step.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "33%" }}>
                      <div style={{ 
                        width: "48px", 
                        height: "48px", 
                        borderRadius: "50%", 
                        background: isActive ? "var(--color-secondary)" : "white",
                        border: `4px solid ${isActive ? "var(--color-secondary)" : "var(--color-border)"}`,
                        color: isActive ? "white" : "var(--color-text-muted)",
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        marginBottom: "1rem",
                        transition: "all 0.3s ease",
                        boxShadow: isCurrent ? "0 0 0 8px rgba(251, 146, 60, 0.15)" : "none"
                      }}>
                        {isActive ? <CheckCircle size={24} /> : <Clock size={24} />}
                      </div>
                      <div style={{ fontWeight: 700, color: isActive ? "var(--color-primary)" : "var(--color-text-muted)", textAlign: "center" }}>
                        {label}
                      </div>
                      {isCurrent && (
                        <div style={{ fontSize: "0.8rem", color: "var(--color-secondary)", fontWeight: 600, marginTop: "0.25rem", textAlign: "center" }}>
                          Estado Actual
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ borderTop: "1px dashed var(--color-border)", paddingTop: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
            <p style={{ margin: "0 0 0.5rem 0" }}><strong>Artículos incluidos ({orderData.itemCount}):</strong></p>
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              {orderData.sampleItems.map((item: string, i: number) => (
                <li key={i}>{item}</li>
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
