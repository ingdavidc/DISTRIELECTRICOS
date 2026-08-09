"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Search } from "lucide-react";
import toast from "react-hot-toast";
import { getPendingReturns, processReturnRequest } from "@/actions/returns";

export default function ReturnsCashierTab() {
  const [returns, setReturns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadReturns();
  }, []);

  const loadReturns = async () => {
    setIsLoading(true);
    try {
      const data = await getPendingReturns();
      setReturns(data);
    } catch (e) {
      toast.error("Error al cargar devoluciones");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async (id: string, approved: boolean) => {
    if (!confirm(`¿Está seguro de ${approved ? 'APROBAR' : 'RECHAZAR'} esta devolución?`)) return;
    
    setIsProcessing(true);
    const tid = toast.loading("Procesando...");
    try {
      const res = await processReturnRequest(id, approved);
      if (res.success) {
        toast.success(`Devolución ${approved ? 'aprobada' : 'rechazada'}`, { id: tid });
        loadReturns();
      } else {
        toast.error(res.error || "Error al procesar", { id: tid });
      }
    } catch (e) {
      toast.error("Error inesperado", { id: tid });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)" }}>
          Autorización de Devoluciones
        </h2>
        <button onClick={loadReturns} className="btn btn-outline" style={{ padding: "0.5rem 1rem" }}>
          Actualizar
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: "1.5rem", alignContent: "start" }}>
        {isLoading ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
            Cargando solicitudes...
          </div>
        ) : returns.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
            No hay devoluciones pendientes de autorización.
          </div>
        ) : (
          returns.map(req => (
            <div key={req.id} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>Orden #{req.orderId.slice(0,8)}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {req.order?.customer?.name} - {req.order?.customer?.identification}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: "var(--color-primary)", fontSize: "1.2rem" }}>
                    ${req.amount.toLocaleString('de-DE')}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-warning)", display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "flex-end" }}>
                    <Clock size={14} /> Esperando Autorización
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>Motivo:</div>
                <div style={{ fontSize: "0.9rem", padding: "0.75rem", background: "var(--color-background)", borderRadius: "var(--radius-md)", fontStyle: "italic" }}>
                  "{req.reason}"
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>Productos a Devolver:</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {req.items.map((item: any) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", padding: "0.5rem", border: "1px dashed var(--color-border)", borderRadius: "4px" }}>
                      <span>{item.quantity}x {item.orderItem?.product?.name}</span>
                      <span style={{ fontWeight: 600 }}>${(item.quantity * item.unitPrice).toLocaleString('de-DE')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "auto", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                <button 
                  onClick={() => handleProcess(req.id, false)}
                  disabled={isProcessing}
                  className="btn btn-outline" style={{ flex: 1, borderColor: "var(--color-danger)", color: "var(--color-danger)", display: "flex", justifyContent: "center", gap: "0.5rem" }}
                >
                  <XCircle size={18} /> Rechazar
                </button>
                <button 
                  onClick={() => handleProcess(req.id, true)}
                  disabled={isProcessing}
                  className="btn btn-primary" style={{ flex: 1, background: "var(--color-success)", display: "flex", justifyContent: "center", gap: "0.5rem" }}
                >
                  <CheckCircle size={18} /> Autorizar y Reembolsar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
