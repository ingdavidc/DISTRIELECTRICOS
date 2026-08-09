import React from "react";

interface VoucherPrint80mmProps {
  order: any;
  paymentDetails?: {
    amountPaid: number;
    method: string;
    date: Date;
  };
}

export default function VoucherPrint80mm({ order, paymentDetails }: VoucherPrint80mmProps) {
  if (!order) return null;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="print-voucher-container">
      {/* 
        This inline style block ensures the CSS applies correctly when printing.
        We hide the rest of the app in the global CSS, but these styles shape the 80mm voucher.
      */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-voucher-container, .print-voucher-container * {
            visibility: visible;
          }
          .print-voucher-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 0;
            margin: 0;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
          }
          @page {
            margin: 0;
            size: 80mm auto;
          }
        }
        @media screen {
          .print-voucher-container {
            display: none;
          }
        }
      `}} />

      <div style={{ textAlign: "center", marginBottom: "15px", borderBottom: "1px dashed #ccc", paddingBottom: "10px" }}>
        <img src="/logo.png" alt="Logo" style={{ maxWidth: "150px", height: "auto", marginBottom: "8px" }} />
        <h2 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "bold" }}>DistriEléctricos E&D</h2>
        <p style={{ margin: "0 0 2px 0", fontStyle: "italic", fontSize: "11px" }}>"Todo el Material Eléctrico para tus Grandes Proyectos"</p>
        <p style={{ margin: "4px 0 2px 0", fontSize: "11px" }}>NIT: 900.123.456-7</p>
        <p style={{ margin: "0 0 2px 0", fontSize: "11px" }}>Dirección: Calle Falsa 123, Local 4</p>
        <p style={{ margin: "0", fontSize: "11px" }}>Teléfono: +57 300 123 4567</p>
      </div>

      <div style={{ marginBottom: "10px", padding: "5px", background: "#f9f9f9", borderRadius: "4px" }}>
        <p style={{ margin: "2px 0" }}><strong>Ticket:</strong> #{order.id.slice(-6).toUpperCase()}</p>
        <p style={{ margin: "2px 0" }}><strong>Fecha:</strong> {formatDate(paymentDetails?.date || new Date())}</p>
        <p style={{ margin: "2px 0" }}><strong>Cliente:</strong> {order.customer?.name || "Consumidor Final"}</p>
        {order.customer?.identification && (
          <p style={{ margin: "2px 0" }}><strong>CC/NIT:</strong> {order.customer.identification}</p>
        )}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px", fontSize: "11px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #000", paddingBottom: "4px", width: "15%" }}>Cant</th>
            <th style={{ textAlign: "left", borderBottom: "1px solid #000", paddingBottom: "4px", width: "55%" }}>Desc</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #000", paddingBottom: "4px", width: "30%" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item: any) => (
            <tr key={item.id}>
              <td style={{ verticalAlign: "top", paddingTop: "6px", textAlign: "center" }}>{item.quantity}</td>
              <td style={{ padding: "6px 4px", wordBreak: "break-word" }}>
                {item.product?.name || item.name || "Producto"}
              </td>
              <td style={{ verticalAlign: "top", textAlign: "right", paddingTop: "6px" }}>
                ${(item.quantity * item.unitPrice).toLocaleString("de-DE")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderTop: "1px dashed #ccc", paddingTop: "10px", marginBottom: "15px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
          <span><strong>Total Pagado:</strong></span>
          <span style={{ fontSize: "14px", fontWeight: "bold" }}>${((paymentDetails?.amountPaid) || order.totalAmount).toLocaleString("de-DE")}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#555" }}>
          <span>Método de pago:</span>
          <span>{paymentDetails?.method || "Efectivo"}</span>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <p style={{ margin: 0, fontWeight: "bold" }}>¡Gracias por su compra!</p>
        <p style={{ margin: "5px 0 0 0", fontSize: "10px" }}>Documento no válido como factura</p>
      </div>
      <div style={{ height: "40px" }}></div>
    </div>
  );
}
