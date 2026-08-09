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

      <div style={{ textAlign: "center", marginBottom: "10px" }}>
        <h2 style={{ margin: "0 0 5px 0", fontSize: "16px", fontWeight: "bold" }}>DistriEléctricos E&D</h2>
        <p style={{ margin: 0 }}>Venta de Materiales Eléctricos</p>
        <p style={{ margin: 0 }}>--------------------------------</p>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <p style={{ margin: "2px 0" }}><strong>Ticket:</strong> #{order.id.slice(-6).toUpperCase()}</p>
        <p style={{ margin: "2px 0" }}><strong>Fecha:</strong> {formatDate(paymentDetails?.date || new Date())}</p>
        <p style={{ margin: "2px 0" }}><strong>Cliente:</strong> {order.customer?.name || "Consumidor Final"}</p>
        {order.customer?.identification && (
          <p style={{ margin: "2px 0" }}><strong>CC/NIT:</strong> {order.customer.identification}</p>
        )}
        <p style={{ margin: 0 }}>--------------------------------</p>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "10px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px dashed #000" }}>Cant</th>
            <th style={{ textAlign: "left", borderBottom: "1px dashed #000" }}>Desc</th>
            <th style={{ textAlign: "right", borderBottom: "1px dashed #000" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {order.items?.map((item: any) => (
            <tr key={item.id}>
              <td style={{ verticalAlign: "top", paddingTop: "4px" }}>{item.quantity}</td>
              <td style={{ padding: "4px 4px", wordBreak: "break-word" }}>
                {item.product?.name || item.name || "Producto"}
              </td>
              <td style={{ verticalAlign: "top", textAlign: "right", paddingTop: "4px" }}>
                ${(item.quantity * item.unitPrice).toLocaleString("de-DE")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ margin: 0 }}>--------------------------------</p>

      <div style={{ textAlign: "right", marginBottom: "10px", marginTop: "10px" }}>
        <p style={{ margin: "2px 0", fontSize: "14px" }}><strong>Total Pagado:</strong> ${((paymentDetails?.amountPaid) || order.totalAmount).toLocaleString("de-DE")}</p>
        <p style={{ margin: "2px 0" }}><strong>Método:</strong> {paymentDetails?.method || "Efectivo"}</p>
      </div>

      <div style={{ textAlign: "center", marginTop: "15px" }}>
        <p style={{ margin: 0, fontWeight: "bold" }}>¡Gracias por su compra!</p>
        <p style={{ margin: "5px 0 0 0", fontSize: "10px" }}>Documento no válido como factura</p>
      </div>
      <div style={{ height: "40px" }}></div>
    </div>
  );
}
