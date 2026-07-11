"use client";

import { useState, useEffect } from "react";
import { getPurchaseOrders, approvePurchaseOrder } from "@/actions/purchases";
import { getSpecialRequests, updateSpecialRequestStatus } from "@/actions/requests";
import { Truck, CheckCircle, Clock, Trash2, Loader2, ShieldAlert, UserCog, FileText } from "lucide-react";
import toast from "react-hot-toast";
import PDFPreviewModal from "@/components/pdf/PDFPreviewModal";

type PurchaseOrder = Awaited<ReturnType<typeof getPurchaseOrders>>[0];

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<{order: any, items: any[]} | null>(null);
  
  // Special Requests
  const [specialRequests, setSpecialRequests] = useState<any[]>([]);

  // Estado local para editar cantidades: { orderId: [items] }
  const [draftItems, setDraftItems] = useState<Record<string, { id: string, quantityNeeded: number }[]>>({});

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getPurchaseOrders();
      setOrders(data);
      
      // Initialize draft state
      const initialDrafts: Record<string, any> = {};
      data.forEach(order => {
        initialDrafts[order.id] = order.items.map((i: any) => ({ id: i.id, quantityNeeded: i.quantityNeeded }));
      });
      setDraftItems(initialDrafts);

      // Load special requests
      const reqs = await getSpecialRequests();
      setSpecialRequests(reqs);

    } catch (error) {
      toast.error("Error al cargar las órdenes de compra");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQtyChange = (orderId: string, itemId: string, newQty: number) => {
    if (newQty < 0) return;
    setDraftItems(prev => ({
      ...prev,
      [orderId]: prev[orderId].map((item: any) => item.id === itemId ? { ...item, quantityNeeded: newQty } : item)
    }));
  };

  const handleRemoveItem = (orderId: string, itemId: string) => {
    setDraftItems(prev => ({
      ...prev,
      [orderId]: prev[orderId].filter(item => item.id !== itemId)
    }));
  };

  const handleApprove = async (orderId: string) => {

    const itemsToSave = draftItems[orderId];
    if (!itemsToSave) return;

    setIsApproving(orderId);
    const toastId = toast.loading("Verificando permisos y enviando correo...");

    const result = await approvePurchaseOrder(orderId, itemsToSave);
    
    if (result.success) {
      toast.success(result.message || "Orden aprobada con éxito", { id: toastId });
      loadOrders();
    } else {
      toast.error(result.error || "Error al aprobar la orden", { id: toastId });
    }
    
    setIsApproving(null);
  };

  const handleUpdateSpecialRequest = async (id: string, newStatus: string) => {
    const tid = toast.loading("Actualizando solicitud...");
    const res = await updateSpecialRequestStatus(id, newStatus);
    if (res.success) {
      toast.success("Solicitud actualizada", { id: tid });
      loadOrders();
    } else {
      toast.error(res.error || "Error al actualizar", { id: tid });
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Órdenes de Compra (Borradores)</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Edita las cantidades sugeridas y apruébalas para enviar al proveedor.
          </p>
        </div>
        
      </div>

      {/* SPECIAL REQUESTS SECTION */}
      {specialRequests.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldAlert size={20} color="#f59e0b" />
            Solicitudes Especiales desde Punto de Venta
          </h2>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto Solicitado</th>
                  <th>Cant.</th>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {specialRequests.map(req => (
                  <tr key={req.id}>
                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>{req.productName}</td>
                    <td>{req.quantity}</td>
                    <td>{req.customerName || "-"}</td>
                    <td>{req.customerPhone || "-"}</td>
                    <td>
                      <span className={`badge ${req.status === 'PENDING' ? 'badge-warning' : req.status === 'SOURCED' ? 'badge-success' : 'badge-danger'}`}>
                        {req.status === 'PENDING' ? 'Pendiente' : req.status === 'SOURCED' ? 'Conseguido' : 'Rechazado'}
                      </span>
                    </td>
                    <td>
                      {req.status === 'PENDING' && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "var(--color-success)", borderColor: "var(--color-success)" }} onClick={() => handleUpdateSpecialRequest(req.id, "SOURCED")}>
                            <CheckCircle size={14} /> Listo
                          </button>
                          <button className="btn btn-outline" style={{ padding: "0.25rem 0.5rem", fontSize: "0.8rem", color: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={() => handleUpdateSpecialRequest(req.id, "REJECTED")}>
                            <Trash2 size={14} /> Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.5rem" }}>
        {isLoading ? (
           <div style={{ display: "flex", justifyContent: "center", padding: "3rem", gridColumn: "1 / -1" }}>
             <Loader2 className="animate-spin" size={40} color="var(--color-primary)" />
           </div>
        ) : orders.length === 0 ? (
           <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)", gridColumn: "1 / -1", background: "white", borderRadius: "var(--radius-lg)" }}>
             No hay órdenes de compra pendientes.
           </div>
        ) : (
          orders.map((order: any) => {
            const currentDrafts = draftItems[order.id] || [];
            
            // Calcular el total de la orden
            const orderTotal = order.items.reduce((sum: any, item: any) => {
              const draftItem = currentDrafts.find(d => d.id === item.id);
              if (!draftItem) return sum;
              return sum + (item.product.cost * draftItem.quantityNeeded);
            }, 0);
            
            return (
              <div key={order.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "1.1rem" }}>
                    <Truck size={20} color="var(--color-primary)" />
                    {order.supplier.name}
                  </div>
                  <span className={`badge ${order.status === 'PENDING' ? 'badge-warning' : order.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}`}>
                    {order.status === 'PENDING' ? 'Borrador' : order.status}
                  </span>
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>Ajustar Cantidades:</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {order.items.map((item: any) => {
                      const draftItem = currentDrafts.find(d => d.id === item.id);
                      if (!draftItem) return null; // Was deleted

                      const itemSubtotal = item.product.cost * draftItem.quantityNeeded;

                      return (
                        <li key={item.id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.95rem", background: "var(--color-background)", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 600 }}>{item.product.name}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <input 
                                type="number" 
                                value={draftItem.quantityNeeded}
                                onChange={(e) => handleQtyChange(order.id, item.id, parseInt(e.target.value) || 0)}
                                disabled={order.status !== 'PENDING'}
                                style={{ width: "60px", padding: "0.25rem", textAlign: "center", borderRadius: "4px", border: "1px solid var(--color-border)" }}
                                title="Cantidad a pedir"
                              />
                              <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{item.product.unit}</span>
                              {order.status === 'PENDING' && (
                                <button onClick={() => handleRemoveItem(order.id, item.id)} style={{ color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                            <span>Costo Unit: ${item.product.cost.toLocaleString('es-CO')}</span>
                            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Subtotal: ${itemSubtotal.toLocaleString('es-CO')}</span>
                          </div>
                        </li>
                      );
                    })}
                    {currentDrafts.length === 0 && (
                      <li style={{ fontSize: "0.85rem", color: "var(--color-danger)" }}>Todos los productos han sido removidos. Se cancelará la orden.</li>
                    )}
                  </ul>
                </div>

                {/* Total de la Orden */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--color-light-gray)", borderRadius: "var(--radius-md)", marginTop: "0.5rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text-muted)" }}>Total Estimado:</span>
                  <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--color-primary)" }}>${orderTotal.toLocaleString('es-CO')}</span>
                </div>

                {order.status === 'PENDING' && (
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <button className="btn btn-outline" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }} onClick={() => loadOrders()}>
                      Restaurar
                    </button>
                    <button 
                      className="btn btn-outline" 
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--color-primary)", borderColor: "var(--color-primary)" }} 
                      onClick={() => {
                        const itemsForPdf = order.items.map((i: any) => {
                          const draftItem = currentDrafts.find(d => d.id === i.id);
                          return draftItem ? { product: i.product, quantityNeeded: draftItem.quantityNeeded } : null;
                        }).filter(Boolean) as any[];
                        setPreviewOrder({ order, items: itemsForPdf });
                      }}
                    >
                      <FileText size={16} />
                      Vista Preliminar
                    </button>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }} 
                      onClick={() => handleApprove(order.id)}
                      disabled={isApproving === order.id}
                    >
                      {isApproving === order.id ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                      Aprobar & Enviar
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {previewOrder && (
        <PDFPreviewModal
          order={previewOrder.order}
          items={previewOrder.items}
          onClose={() => setPreviewOrder(null)}
        />
      )}
    </>
  );
}
