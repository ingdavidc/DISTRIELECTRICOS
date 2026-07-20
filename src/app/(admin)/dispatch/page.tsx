"use client";

import { useState, useEffect } from "react";
import { Truck, Store, MapPin, Package, Clock, CheckCircle, Printer, CheckSquare, Search, Phone, AlertTriangle, Eye, CornerDownLeft } from "lucide-react";
import toast from "react-hot-toast";
import { getOrdersForDispatch, markOrderAsReady, markOrderAsDelivered } from "@/actions/dispatch";
import { getPendingCounterRequests, markCounterRequestDelivered, markCounterRequestReturned } from "@/actions/counter";

type Order = Awaited<ReturnType<typeof getOrdersForDispatch>>[0];

export default function DispatchPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [counterRequests, setCounterRequests] = useState<any[]>([]);

  const loadOrders = async () => {
    try {
      const data = await getOrdersForDispatch();
      setOrders(data);
      const reqs = await getPendingCounterRequests();
      setCounterRequests(reqs);
      if (selectedOrder) {
        const stillExists = data.find((o: any) => o.id === selectedOrder.id);
        if (!stillExists) setSelectedOrder(null);
        else setSelectedOrder(stillExists);
      }
    } catch (error) {
      toast.error("Error al cargar pedidos para despacho");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkReady = async () => {
    if (!selectedOrder) return;
    setIsProcessing(true);
    const tid = toast.loading("Marcando como listo...");
    const res = await markOrderAsReady(selectedOrder.id);
    if (res.success) {
      toast.success("Pedido listo para entrega (Notificado)", { id: tid });
      loadOrders();
    } else {
      toast.error(res.error || "Error", { id: tid });
    }
    setIsProcessing(false);
  };

  const handleMarkDelivered = async () => {
    if (!selectedOrder) return;
    if (!confirm("¿Confirma que el pedido ha sido entregado definitivamente al cliente o transportador?")) return;
    
    setIsProcessing(true);
    const tid = toast.loading("Cerrando pedido...");
    const res = await markOrderAsDelivered(selectedOrder.id);
    if (res.success) {
      toast.success("Pedido entregado", { id: tid });
      setSelectedOrder(null);
      loadOrders();
    } else {
      toast.error(res.error || "Error", { id: tid });
    }
    setIsProcessing(false);
  };

  const handleCounterDelivered = async (id: string) => {
    const tid = toast.loading("Marcando entregado a mostrador...");
    const res = await markCounterRequestDelivered(id);
    if (res.success) {
      toast.success("Marcado como entregado", { id: tid });
      loadOrders();
    } else {
      toast.error(res.error || "Error", { id: tid });
    }
  };

  const handleCounterReturned = async (id: string) => {
    const tid = toast.loading("Retornando al inventario...");
    const res = await markCounterRequestReturned(id);
    if (res.success) {
      toast.success("Retornado a bodega", { id: tid });
      loadOrders();
    } else {
      toast.error(res.error || "Error", { id: tid });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (o.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="no-print" style={{ display: "flex", height: "calc(100vh - 64px - 4rem)", gap: "1.5rem" }}>
        
        {/* LEFT COLUMN: COLA DE PREPARACIÓN */}
        <div className="card" style={{ flex: "1 1 35%", display: "flex", flexDirection: "column", padding: "0", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-background)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={20} />
                Cola de Bodega
              </h2>
              <span className="badge badge-warning" style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>{filteredOrders.length}</span>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input 
                type="text" 
                className="form-input" 
                placeholder="Buscar por ID o Cliente..." 
                style={{ paddingLeft: "2.25rem" }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            
            {/* COUNTER REQUESTS ALERTS */}
            {counterRequests.length > 0 && (
              <div style={{ flexShrink: 0, border: "2px solid var(--color-danger)", borderRadius: "var(--radius-md)", overflow: "hidden", animation: "pulse 2s infinite" }}>
                <div style={{ background: "var(--color-danger)", color: "white", padding: "0.5rem 1rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
                  <AlertTriangle size={18} />
                  🚨 SOLICITUDES A MOSTRADOR
                </div>
                <div style={{ background: "#fff", padding: "0.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {counterRequests.map((req: any) => (
                    <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderBottom: "1px solid #eee" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.15rem" }}>
                          <div style={{ fontWeight: "bold", color: "var(--color-danger)" }}>{req.product.sku}</div>
                          {req.user && (
                            <div style={{ fontSize: "0.7rem", background: "#f3f4f6", padding: "2px 6px", borderRadius: "12px", color: "#555", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <span>👤</span> {req.user.name?.split(' ')[0] || req.user.email || "Caja"}
                            </div>
                          )}
                        </div>
                        <div style={{ fontSize: "0.85rem", marginBottom: "0.25rem" }}>{req.product.name}</div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            {req.status === "PENDING" ? "⏳ Esperando envío..." : "✅ En mostrador"}
                          </div>
                          
                          {req.product.location && (
                            <div style={{ fontSize: "0.75rem", color: "var(--color-navy)", display: "flex", alignItems: "center", gap: "0.25rem", background: "rgba(32,53,98,0.1)", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                              <MapPin size={12} />
                              Ubic: {req.product.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        {req.status === "PENDING" && (
                          <button onClick={() => handleCounterDelivered(req.id)} className="btn btn-primary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}>
                            <CheckCircle size={14} style={{ marginRight: "0.25rem" }} /> Entregado
                          </button>
                        )}
                        {req.status === "DELIVERED" && (
                          <button onClick={() => handleCounterReturned(req.id)} className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "var(--color-danger)" }}>
                            <CornerDownLeft size={14} style={{ marginRight: "0.25rem" }} /> Devuelto
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <style>
              {`
                @keyframes pulse {
                  0% { box-shadow: 0 0 0 0 rgba(235, 45, 52, 0.4); }
                  70% { box-shadow: 0 0 0 10px rgba(235, 45, 52, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(235, 45, 52, 0); }
                }
              `}
            </style>

            {isLoading ? (
               <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>Cargando cola...</div>
            ) : filteredOrders.length === 0 ? (
               <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>No hay pedidos en cola.</div>
            ) : (
              filteredOrders.map((order: any) => (
                <div 
                  key={order.id} 
                  onClick={() => setSelectedOrder(order)}
                  style={{ 
                    padding: "1rem", 
                    border: "2px solid",
                    borderColor: selectedOrder?.id === order.id ? "var(--color-primary)" : "var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    cursor: "pointer",
                    background: selectedOrder?.id === order.id ? "rgba(32,53,98,0.03)" : "white",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      #{order.id.slice(-6).toUpperCase()}
                      {order.status === 'READY' ? (
                        <span className="badge badge-warning">Alistado</span>
                      ) : (
                        <span className="badge badge-danger">Por Alistar</span>
                      )}
                    </div>
                    {order.deliveryType === 'DOMICILIO' ? (
                      <span title="Envío a Domicilio" style={{ color: "var(--color-primary)", background: "rgba(32,53,98,0.1)", padding: "0.25rem 0.5rem", borderRadius: "4px", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }}>
                        <Truck size={14} /> Domicilio
                      </span>
                    ) : (
                      <span title="Retiro en Tienda" style={{ color: "var(--color-secondary)", background: "rgba(245, 158, 11, 0.1)", padding: "0.25rem 0.5rem", borderRadius: "4px", display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem", fontWeight: 600 }}>
                        <Store size={14} /> Retiro
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Clock size={14} /> {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PANEL DE ALISTAMIENTO */}
        <div className="card" style={{ flex: "1 1 65%", display: "flex", flexDirection: "column", padding: "0" }}>
          
          {selectedOrder ? (
            <>
              {/* Header */}
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-background)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Alistamiento #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    Cliente: {selectedOrder.customer?.name || "Consumidor Final"}
                    {selectedOrder.customer?.phone && (
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginLeft: "1rem" }}>
                        <Phone size={12} /> {selectedOrder.customer.phone}
                      </span>
                    )}
                  </div>
                </div>
                <button onClick={handlePrint} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Printer size={18} /> Imprimir Checklist
                </button>
              </div>

              {selectedOrder.notes && (
                <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--color-border)", background: "rgba(245, 158, 11, 0.05)" }}>
                  <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#d97706", margin: 0 }}>Observaciones / Notas</h3>
                  <p style={{ fontSize: "0.95rem", color: "var(--color-text-main)", marginTop: "0.25rem", margin: 0 }}>{selectedOrder.notes}</p>
                </div>
              )}

              {/* Items List for Warehouse */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--color-primary)" }}>Artículos a Buscar</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {selectedOrder.items.map((item: any) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "white" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.25rem" }}>SKU: {item.product.sku}</div>
                        <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>{item.product.name}</div>
                      </div>
                      
                      {/* Ubicación en Bodega */}
                      <div style={{ background: "rgba(32,53,98,0.05)", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(32,53,98,0.1)", display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "150px" }}>
                        <MapPin size={18} color="var(--color-primary)" />
                        <div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Ubicación</div>
                          <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>{item.product.location || "Sin Asignar"}</div>
                        </div>
                      </div>

                      <div style={{ marginLeft: "2rem", textAlign: "center" }}>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Cant.</div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{item.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-border)", background: "var(--color-background)", display: "flex", gap: "1rem" }}>
                {selectedOrder.status !== 'READY' && (
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: "1.25rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.75rem" }}
                    onClick={handleMarkReady}
                    disabled={isProcessing}
                  >
                    <CheckSquare size={24} />
                    MARCAR ALISTAMIENTO TERMINADO
                  </button>
                )}
                <button 
                  className="btn" 
                  style={{ flex: 1, padding: "1.25rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.75rem", background: "var(--color-success)", color: "white" }}
                  onClick={handleMarkDelivered}
                  disabled={isProcessing}
                >
                  <CheckCircle size={24} />
                  ENTREGAR AL CLIENTE (CERRAR)
                </button>
              </div>

            </>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", gap: "1rem", padding: "2rem", textAlign: "center" }}>
              <Package size={64} opacity={0.2} />
              <p style={{ fontSize: "1.1rem" }}>Selecciona un pedido de la cola para ver los detalles de alistamiento.</p>
            </div>
          )}
        </div>
      </div>

      {/* PRINT ONLY SECTION - CHECKLIST */}
      {selectedOrder && (
        <div className="print-only" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid black", paddingBottom: "1rem", marginBottom: "2rem" }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.5rem" }}>DISTRIELECTRICOS</h1>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>Lista de Empaque / Entrega</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem" }}>Ticket #{selectedOrder.id.slice(-6).toUpperCase()}</h2>
              <p style={{ margin: "0.25rem 0", fontSize: "0.9rem" }}>{new Date(selectedOrder.createdAt).toLocaleDateString()} {new Date(selectedOrder.createdAt).toLocaleTimeString()}</p>
            </div>
          </div>

          <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>Cliente:</strong> {selectedOrder.customer?.name || "Consumidor Final"}<br/>
              <strong>Documento:</strong> {selectedOrder.customer?.identification || "N/A"}<br/>
              <strong>Teléfono:</strong> {selectedOrder.customer?.phone || "N/A"}<br/>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>Tipo de Entrega:</strong> {selectedOrder.deliveryType === 'DOMICILIO' ? "Envío a Domicilio" : "Retiro en Tienda"}<br/>
              <strong>Estado:</strong> {selectedOrder.status === 'READY' ? "Listo" : "En Preparación"}<br/>
            </div>
          </div>

          {selectedOrder.notes && (
            <div style={{ padding: "1rem", border: "1px solid black", marginBottom: "2rem" }}>
              <strong>Observaciones:</strong> {selectedOrder.notes}
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "3rem" }}>
            <thead>
              <tr>
                <th style={{ borderBottom: "2px solid black", padding: "0.5rem", textAlign: "left", width: "40px" }}>OK</th>
                <th style={{ borderBottom: "2px solid black", padding: "0.5rem", textAlign: "left", width: "80px" }}>Cant</th>
                <th style={{ borderBottom: "2px solid black", padding: "0.5rem", textAlign: "left" }}>Código</th>
                <th style={{ borderBottom: "2px solid black", padding: "0.5rem", textAlign: "left" }}>Descripción de Artículo</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>
                    <div style={{ width: "20px", height: "20px", border: "2px solid black", borderRadius: "3px" }}></div>
                  </td>
                  <td style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", fontWeight: "bold", fontSize: "1.1rem" }}>{item.quantity}</td>
                  <td style={{ borderBottom: "1px solid #ccc", padding: "0.75rem", fontSize: "0.9rem" }}>{item.product.sku}</td>
                  <td style={{ borderBottom: "1px solid #ccc", padding: "0.75rem" }}>{item.product.name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "4rem" }}>
            <p style={{ fontSize: "0.9rem", marginBottom: "2rem" }}>
              Recibo a entera satisfacción los artículos detallados en este documento, verificando cantidades y referencias.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4rem" }}>
              <div style={{ width: "45%", borderTop: "1px solid black", paddingTop: "0.5rem" }}>
                Firma de quien Recibe:<br/>
                CC/NIT:
              </div>
              <div style={{ width: "45%", borderTop: "1px solid black", paddingTop: "0.5rem" }}>
                Firma de quien Despacha:<br/>
                Nombre Bodeguero:
              </div>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
