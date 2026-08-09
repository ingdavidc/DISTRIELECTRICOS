"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw, Send, CheckCircle, Package } from "lucide-react";
import toast from "react-hot-toast";
import { getCustomerOrders } from "@/actions/customers";
import { searchCustomerOrdersForPayment } from "@/actions/payments";
import { createReturnRequest, getPosReturnRequests } from "@/actions/returns";

export default function ReturnsPosTab() {
  const [activeTab, setActiveTab] = useState<"NEW" | "STATUS">("NEW");
  
  // Tab NEW state
  const [searchQuery, setSearchQuery] = useState("");
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [returnItems, setReturnItems] = useState<{ [key: string]: number }>({});
  const [returnReason, setReturnReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Tab STATUS state
  const [requestsHistory, setRequestsHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === "STATUS") {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const data = await getPosReturnRequests();
      setRequestsHistory(data);
    } catch (e) {
      toast.error("Error al cargar historial");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    const tid = toast.loading("Buscando pedido...");
    try {
      const results = await searchCustomerOrdersForPayment(searchQuery);
      setOrders(results);
      if (results.length === 0) {
        toast.error("No se encontraron pedidos con ese dato.", { id: tid });
      } else {
        toast.dismiss(tid);
      }
    } catch (e) {
      toast.error("Error al buscar", { id: tid });
    }
  };

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setReturnItems({});
    setReturnReason("");
  };

  const toggleReturnItem = (itemId: string, maxQty: number) => {
    setReturnItems(prev => {
      const next = { ...prev };
      if (next[itemId]) {
        delete next[itemId];
      } else {
        next[itemId] = 1;
      }
      return next;
    });
  };

  const updateQuantity = (itemId: string, delta: number, maxQty: number) => {
    setReturnItems(prev => {
      const current = prev[itemId] || 1;
      const nextQty = current + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      if (nextQty > maxQty) return prev;
      return { ...prev, [itemId]: nextQty };
    });
  };

  const handleSubmitReturn = async () => {
    const selectedIds = Object.keys(returnItems);
    if (selectedIds.length === 0) {
      return toast.error("Seleccione al menos un producto para devolver.");
    }
    if (!returnReason.trim()) {
      return toast.error("Debe ingresar un motivo para la devolución.");
    }

    setIsProcessing(true);
    const tid = toast.loading("Enviando solicitud a Caja...");

    const itemsPayload = selectedIds.map(id => {
      const orderItem = selectedOrder.items.find((i: any) => i.id === id);
      return {
        orderItemId: id,
        quantity: returnItems[id],
        unitPrice: orderItem.unitPrice
      };
    });

    try {
      const res = await createReturnRequest(selectedOrder.id, itemsPayload, returnReason);
      if (res.success) {
        toast.success("Solicitud de devolución enviada a Caja.", { id: tid });
        setSelectedOrder(null);
        setReturnItems({});
        setReturnReason("");
        setSearchQuery("");
        setOrders([]);
        setActiveTab("STATUS");
      } else {
        toast.error(res.error || "Error al enviar la solicitud.", { id: tid });
      }
    } catch (e) {
      toast.error("Error inesperado.", { id: tid });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button 
          className={`btn ${activeTab === "NEW" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("NEW")}
          style={{ padding: "0.5rem 1rem", borderRadius: "8px" }}
        >
          Nueva Solicitud
        </button>
        <button 
          className={`btn ${activeTab === "STATUS" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("STATUS")}
          style={{ padding: "0.5rem 1rem", borderRadius: "8px" }}
        >
          Estado de Solicitudes
        </button>
      </div>

      {activeTab === "NEW" ? (
        <div style={{ display: "flex", gap: "1.5rem", flex: 1, overflow: "hidden" }}>
          {/* Left Column: Search & List */}
          <div className="card" style={{ flex: "1 1 40%", display: "flex", flexDirection: "column", padding: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RotateCcw size={20} />
              Buscar Pedido
            </h2>
            
            <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: "2.5rem", width: "100%" }} 
                  placeholder="Buscar por cédula o número de orden..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary">Buscar</button>
            </form>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {orders.map(order => (
                <div 
                  key={order.id}
                  onClick={() => handleSelectOrder(order)}
                  style={{ 
                    padding: "1rem", border: "1px solid", 
                    borderColor: selectedOrder?.id === order.id ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: selectedOrder?.id === order.id ? "rgba(32,53,98,0.05)" : "white",
                    borderRadius: "var(--radius-md)", cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Orden #{order.id.slice(0,8)}</span>
                    <span style={{ fontWeight: 600 }}>${order.totalAmount.toLocaleString('de-DE')}</span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {order.customer?.name} - {order.customer?.identification}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                    Estado: {order.status}
                  </div>
                </div>
              ))}
              {orders.length === 0 && searchQuery && (
                 <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem" }}>
                   Usa el buscador para encontrar un pedido.
                 </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Details & Return Form */}
          <div className="card" style={{ flex: "1 1 60%", display: "flex", flexDirection: "column", padding: "1.5rem" }}>
            {selectedOrder ? (
              <>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "1.5rem" }}>
                  Detalles del Pedido #{selectedOrder.id.slice(0,8)}
                </h2>
                
                <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                  Selecciona los productos que el cliente desea devolver y la cantidad.
                </p>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                  {selectedOrder.items.map((item: any) => {
                    const isSelected = !!returnItems[item.id];
                    return (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", gap: "1rem" }}>
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleReturnItem(item.id, item.quantity)}
                          style={{ width: "20px", height: "20px" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{item.product.name}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                            Comprados: {item.quantity} | Precio und: ${item.unitPrice.toLocaleString('de-DE')}
                          </div>
                        </div>
                        {isSelected && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--color-background)", borderRadius: "var(--radius-md)", padding: "0.25rem" }}>
                            <button 
                              onClick={() => updateQuantity(item.id, -1, item.quantity)}
                              className="btn-icon" style={{ background: "white", padding: "0.25rem", borderRadius: "4px" }}
                            >
                              -
                            </button>
                            <span style={{ fontWeight: 600, width: "30px", textAlign: "center" }}>{returnItems[item.id]}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1, item.quantity)}
                              className="btn-icon" style={{ background: "white", padding: "0.25rem", borderRadius: "4px" }}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "auto", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.9rem", fontWeight: 600, marginBottom: "0.5rem" }}>Motivo de la Devolución</label>
                  <textarea 
                    className="form-input" 
                    style={{ width: "100%", minHeight: "80px", resize: "none", marginBottom: "1.5rem" }} 
                    placeholder="Ej. Producto defectuoso, cambio de opinión..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />

                  <button 
                    onClick={handleSubmitReturn}
                    disabled={isProcessing || Object.keys(returnItems).length === 0}
                    className="btn btn-secondary" 
                    style={{ width: "100%", padding: "1rem", fontSize: "1.05rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}
                  >
                    <Send size={20} />
                    {isProcessing ? "Enviando..." : "Solicitar Autorización a Caja"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", gap: "1rem" }}>
                <Package size={48} opacity={0.2} />
                <p>Selecciona un pedido para iniciar la devolución</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card" style={{ flex: 1, padding: "1.5rem", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)" }}>
              Mis Solicitudes de Devolución (Hoy)
            </h2>
            <button onClick={loadHistory} className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
              Actualizar
            </button>
          </div>

          {isLoadingHistory ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>Cargando solicitudes...</div>
          ) : requestsHistory.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>No has realizado solicitudes de devolución hoy.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1rem" }}>
              {requestsHistory.map(req => (
                <div key={req.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ fontWeight: 600 }}>Orden #{req.orderId.slice(0,8)}</div>
                    <div>
                      {req.status === 'PENDING_AUTHORIZATION' && <span className="badge badge-warning">Esperando Autorización (Caja)</span>}
                      {req.status === 'APPROVED' && <span className="badge badge-success">Aprobada</span>}
                      {req.status === 'REJECTED' && <span className="badge badge-danger">Rechazada</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "1rem" }}>
                    {new Date(req.createdAt).toLocaleTimeString()} - Cliente: {req.order?.customer?.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {req.items.map((item: any) => (
                      <div key={item.id} style={{ fontSize: "0.85rem", display: "flex", justifyContent: "space-between", padding: "0.25rem", borderBottom: "1px dashed var(--color-border)" }}>
                        <span>{item.quantity}x {item.orderItem?.product?.name}</span>
                        <span style={{ fontWeight: 600 }}>${(item.quantity * item.unitPrice).toLocaleString('de-DE')}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: "1rem", paddingTop: "0.5rem", borderTop: "1px solid var(--color-border)", textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                    Total Reembolso: ${req.amount.toLocaleString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
