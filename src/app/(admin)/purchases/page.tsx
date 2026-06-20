"use client";

import { useState, useEffect } from "react";
import { getPurchaseOrders, approvePurchaseOrder } from "@/actions/purchases";
import { Truck, CheckCircle, Clock, Trash2, Loader2, ShieldAlert, UserCog, FileText } from "lucide-react";
import toast from "react-hot-toast";
import PDFPreviewModal from "@/components/pdf/PDFPreviewModal";

type PurchaseOrder = Awaited<ReturnType<typeof getPurchaseOrders>>[0];

export default function PurchasesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<{order: any, items: any[]} | null>(null);
  
  // Simulador de Rol (ya que no hay login aún)
  const [simulatedRole, setSimulatedRole] = useState<"ADMIN" | "WAREHOUSE">("ADMIN");

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
    if (simulatedRole !== 'ADMIN') {
      toast.error("Acceso Denegado: Solo los administradores pueden aprobar compras.");
      return;
    }

    const itemsToSave = draftItems[orderId];
    if (!itemsToSave) return;

    setIsApproving(orderId);
    const toastId = toast.loading("Verificando permisos y enviando correo...");

    const result = await approvePurchaseOrder(orderId, itemsToSave, simulatedRole);
    
    if (result.success) {
      toast.success(result.message || "Orden aprobada con éxito", { id: toastId });
      loadOrders();
    } else {
      toast.error(result.error || "Error al aprobar la orden", { id: toastId });
    }
    
    setIsApproving(null);
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
        
        {/* Simulador de Rol */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "white", padding: "0.5rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <UserCog size={18} color="var(--color-primary)" />
          <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Simular Rol:</span>
          <select 
            value={simulatedRole} 
            onChange={(e) => setSimulatedRole(e.target.value as any)}
            style={{ padding: "0.25rem", borderRadius: "4px", border: "1px solid #ccc" }}
          >
            <option value="ADMIN">Administrador</option>
            <option value="WAREHOUSE">Bodeguero</option>
          </select>
        </div>
      </div>

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
                            <span>Costo Unit: ${item.product.cost.toLocaleString()}</span>
                            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Subtotal: ${itemSubtotal.toLocaleString()}</span>
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
                  <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "var(--color-primary)" }}>${orderTotal.toLocaleString()}</span>
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
                      {simulatedRole === 'ADMIN' ? 'Aprobar & Enviar' : <><ShieldAlert size={16}/> Solo Admin</>}
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
