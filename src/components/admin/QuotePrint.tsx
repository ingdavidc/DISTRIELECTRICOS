"use client";

import React from "react";

interface QuotePrintProps {
  quote: any;
  format: "LETTER" | "HALF_LETTER";
  previewMode?: boolean;
}

export default function QuotePrint({ quote, format, previewMode = false }: QuotePrintProps) {
  if (!quote) return null;

  const isHalf = format === "HALF_LETTER";
  const paperWidth = "8.5in";
  const paperHeight = isHalf ? "5.5in" : "11in";

  const formatDate = (date: any) => {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    }).format(new Date(date));
  };

  return (
    <>
      {!previewMode && (
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #quote-print-area, #quote-print-area * {
              visibility: visible;
            }
            #quote-print-area {
              display: block !important;
              position: absolute;
              left: 0;
              top: 0;
              width: ${paperWidth};
              height: ${paperHeight};
              padding: ${isHalf ? '0.5in' : '0.75in'};
              box-sizing: border-box;
              background: white;
              font-family: Arial, sans-serif;
              color: #000;
            }
            @page {
              size: ${paperWidth} ${paperHeight};
              margin: 0;
            }
          }
        `}</style>
      )}

      <div 
        id={!previewMode ? "quote-print-area" : undefined} 
        style={previewMode ? {
          width: paperWidth,
          minHeight: paperHeight,
          padding: isHalf ? '0.5in' : '0.75in',
          boxSizing: "border-box",
          background: "white",
          fontFamily: "Arial, sans-serif",
          color: "#000",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          margin: "0 auto",
          transform: "scale(0.8)",
          transformOrigin: "top center"
        } : { display: "none" }}
      >
        {/* Background Watermark */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("/logo.png")', backgroundRepeat: "no-repeat", backgroundPosition: "center", backgroundSize: "70%", opacity: 0.1, zIndex: 0, pointerEvents: "none" }} />

        {/* Header */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #003366", paddingBottom: "15px", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <img src="/logo.png" alt="Logo" style={{ maxWidth: "120px", height: "auto" }} />
            <div>
              <h2 style={{ margin: "0 0 5px 0", fontSize: "18px", color: "#003366" }}>DistriEléctricos E&D</h2>
              <p style={{ margin: "0 0 3px 0", fontSize: "12px" }}>NIT: 109860861-8</p>
              <p style={{ margin: "0 0 3px 0", fontSize: "12px" }}>Dirección: Cl. 25 #12 - 55, Saravena, Arauca</p>
              <p style={{ margin: "0 0 3px 0", fontSize: "12px" }}>WhatsApp/Tel: 313 223 9174</p>
              <p style={{ margin: "0", fontSize: "12px" }}>Web: www.distrielectricoseyd.com</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: "0 0 10px 0", fontSize: "28px", color: "#003366", textTransform: "uppercase" }}>Cotización</h1>
            <div style={{ padding: "8px 15px", background: "#f0f4f8", border: "1px solid #cce0ff", borderRadius: "6px", display: "inline-block" }}>
              <p style={{ margin: "0 0 5px 0", fontSize: "16px", fontWeight: "bold", color: "#d32f2f" }}>{quote.quoteNumber}</p>
              <p style={{ margin: 0, fontSize: "12px" }}><strong>Fecha:</strong> {formatDate(quote.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", gap: "20px", marginBottom: "20px" }}>
          <div style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#003366", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Datos del Cliente</h3>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}><strong>Nombre:</strong> {quote.customer?.name || "Consumidor Final"}</p>
            {quote.customer?.identification && <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}><strong>CC/NIT:</strong> {quote.customer.identification}</p>}
            {quote.customer?.phone && <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}><strong>Teléfono:</strong> {quote.customer.phone}</p>}
            {quote.customer?.email && <p style={{ margin: "0", fontSize: "12px" }}><strong>Email:</strong> {quote.customer.email}</p>}
          </div>
          <div style={{ width: "200px", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#003366", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>Condiciones</h3>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}><strong>Validez:</strong> 15 Días</p>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}><strong>Pago:</strong> Efectivo</p>
            <p style={{ margin: "0 0 4px 0", fontSize: "12px" }}><strong>Entrega:</strong> {quote.deliveryType}</p>
            <p style={{ margin: "0", fontSize: "12px" }}><strong>Vendedor:</strong> {quote.user?.name || "Asesor"}</p>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ position: "relative", zIndex: 1, width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "12px" }}>
          <thead>
            <tr style={{ background: "#003366", color: "white" }}>
              <th style={{ padding: "8px", textAlign: "center", width: "8%" }}>Img</th>
              <th style={{ padding: "8px", textAlign: "center", width: "7%" }}>Cant</th>
              <th style={{ padding: "8px", textAlign: "left", width: "45%" }}>Descripción</th>
              <th style={{ padding: "8px", textAlign: "right", width: "20%" }}>V. Unitario</th>
              <th style={{ padding: "8px", textAlign: "right", width: "20%" }}>V. Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items?.map((item: any, i: number) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee", background: "rgba(255,255,255,0.7)" }}>
                <td style={{ padding: "4px", textAlign: "center" }}>
                  {item.product?.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product?.name} style={{ width: "35px", height: "35px", objectFit: "contain", borderRadius: "4px" }} />
                  ) : (
                    <div style={{ width: "35px", height: "35px", background: "#f0f0f0", borderRadius: "4px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "9px" }}>N/A</div>
                  )}
                </td>
                <td style={{ padding: "8px", textAlign: "center" }}>{item.quantity}</td>
                <td style={{ padding: "8px" }}>{item.product?.name || item.name || "Producto Especial"}</td>
                <td style={{ padding: "8px", textAlign: "right" }}>${item.unitPrice.toLocaleString('de-DE')}</td>
                <td style={{ padding: "8px", textAlign: "right", fontWeight: "bold" }}>${(item.quantity * item.unitPrice).toLocaleString('de-DE')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "flex-end", marginBottom: "30px" }}>
          <div style={{ width: "250px", border: "1px solid #ccc", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: "12px" }}>
              <span>Subtotal (Sin IVA):</span>
              <span>${Math.round(quote.totalAmount / 1.19).toLocaleString('de-DE')}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: "12px" }}>
              <span>IVA (19%):</span>
              <span>${Math.round(quote.totalAmount - (quote.totalAmount / 1.19)).toLocaleString('de-DE')}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#f0f4f8", fontSize: "16px", fontWeight: "bold", color: "#003366" }}>
              <span>TOTAL:</span>
              <span>${quote.totalAmount.toLocaleString('de-DE')}</span>
            </div>
          </div>
        </div>

        {/* Notes & Footer */}
        {quote.notes && (
          <div style={{ position: "relative", zIndex: 1, marginBottom: "20px" }}>
            <p style={{ margin: "0 0 5px 0", fontSize: "12px", fontWeight: "bold" }}>Observaciones:</p>
            <p style={{ margin: 0, fontSize: "11px", padding: "10px", background: "#fffbc8", border: "1px solid #e0d000", borderRadius: "4px" }}>
              {quote.notes}
            </p>
          </div>
        )}

        <div style={{ position: "relative", zIndex: 1, marginTop: "40px", borderTop: "1px solid #ccc", paddingTop: "15px", textAlign: "center", fontSize: "10px", color: "#666" }}>
          <p style={{ margin: "0 0 4px 0" }}>Esta cotización está sujeta a cambios de precio y disponibilidad de inventario sin previo aviso.</p>
          <p style={{ margin: 0 }}>Generado por el Sistema POS DistriEléctricos E&D</p>
        </div>
      </div>
    </>
  );
}
