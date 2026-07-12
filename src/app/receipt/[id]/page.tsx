import { getPublicOrderReceipt } from "@/actions/public";
import { MapPin, Phone, Globe } from "lucide-react";
import PrintButton from "@/components/ui/PrintButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReceiptPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const order = await getPublicOrderReceipt(params.id);

  if (!order || (order as any).error) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#666" }}>
        <h2>Recibo no encontrado o Error</h2>
        <p>Buscando ID: {params.id}</p>
        <p>{(order as any)?.error || "El código de orden proporcionado no existe."}</p>
      </div>
    );
  }

  const isFactura = order.receiptType === "FACTURA";

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "2rem 1rem", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "400px", margin: "0 auto", backgroundColor: "#fff", padding: "2rem", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        
        {/* Encabezado */}
        <div style={{ textAlign: "center", borderBottom: "2px dashed #eee", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
          <img src="/logo.png" alt="DISTRIELECTRICOS E&D" style={{ maxHeight: "80px", margin: "0 auto 0.5rem auto", display: "block" }} />
          <p style={{ margin: "0.2rem 0", fontSize: "0.85rem", color: "#666" }}>IDEAS CON ENERGÍA</p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem", marginTop: "0.8rem", fontSize: "0.8rem", color: "#666" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Phone size={14} style={{ flexShrink: 0 }}/> +57 313 223 9174</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><Globe size={14} style={{ flexShrink: 0 }}/> www.distrielectricoseyd.com</span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><MapPin size={14} style={{ flexShrink: 0 }}/> CALLE 25 # 12-55, Saravena - Arauca</span>
          </div>
        </div>

        {/* Info del Ticket */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", textAlign: "center", marginBottom: "1rem" }}>
            {isFactura ? "FACTURA ELECTRÓNICA" : "RECIBO DE VENTA"}
          </h2>
          <div style={{ fontSize: "0.85rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", color: "#444" }}>
            <div><strong>Orden:</strong> #{order.id.slice(0, 8).toUpperCase()}</div>
            <div style={{ textAlign: "right" }}><strong>Fecha:</strong> {new Date(order.createdAt).toLocaleDateString()}</div>
            {order.customer && (
              <div style={{ gridColumn: "1 / -1" }}>
                <strong>Cliente:</strong> {order.customer.name} <br/>
                {order.customer.identification && <span><strong>NIT/CC:</strong> {order.customer.identification}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Productos */}
        <div style={{ marginBottom: "1.5rem" }}>
          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #eee", textAlign: "left" }}>
                <th style={{ paddingBottom: "0.5rem", width: "15%" }}>Cant</th>
                <th style={{ paddingBottom: "0.5rem", width: "55%" }}>Producto</th>
                <th style={{ paddingBottom: "0.5rem", textAlign: "right", width: "30%" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item: any) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #f9f9f9" }}>
                  <td style={{ padding: "0.5rem 0", verticalAlign: "top" }}>{item.quantity}</td>
                  <td style={{ padding: "0.5rem 0", verticalAlign: "top", color: "#333" }}>{item.product.name}</td>
                  <td style={{ padding: "0.5rem 0", verticalAlign: "top", textAlign: "right", fontWeight: "bold" }}>
                    ${(item.quantity * item.unitPrice).toLocaleString('de-DE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div style={{ borderTop: "2px dashed #eee", paddingTop: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: "bold", color: "#ff6b00" }}>
            <span>TOTAL:</span>
            <span>${order.totalAmount.toLocaleString('de-DE')}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginTop: "0.5rem", color: "#666" }}>
            <span>Monto Pagado:</span>
            <span>${order.amountPaid.toLocaleString('de-DE')}</span>
          </div>
          {order.totalAmount > order.amountPaid && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginTop: "0.25rem", color: "#d93025", fontWeight: "bold" }}>
              <span>Saldo Pendiente:</span>
              <span>${(order.totalAmount - order.amountPaid).toLocaleString('de-DE')}</span>
            </div>
          )}
          
          {order.payments && order.payments.length > 0 && (
            <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#555", backgroundColor: "#f9f9f9", padding: "0.75rem", borderRadius: "6px", border: "1px solid #eaeaea" }}>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Medios de Pago:</strong>
              <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
                {order.payments.map((p: any) => (
                  <li key={p.id}>
                    {p.method} {p.bank ? `(${p.bank})` : ""} - <strong>${p.amount.toLocaleString('de-DE')}</strong>
                    {p.transactionId ? ` (Ref: ${p.transactionId})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Botón de Imprimir */}
        <div className="no-print" style={{ marginTop: "2rem", textAlign: "center" }}>
          <PrintButton />
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
        }
      `}} />
    </div>
  );
}
