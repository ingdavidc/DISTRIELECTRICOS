"use client";

import { useState } from "react";
import { FileText, Download, Send, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { generateQuotePdf } from "@/utils/generateQuotePdf";
import toast from "react-hot-toast";

export default function MisCotizacionesClient({ quotes }: { quotes: any[] }) {
  const [quoteList, setQuoteList] = useState(quotes);

  const handleDownload = (quote: any) => {
    generateQuotePdf(
      quote.clientName,
      "Aliado Experto", // Ideally we pass the real name
      quote.items.map((i: any) => ({
        name: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        pvpPrice: i.pvpPrice
      })),
      quote.totalPvp
    );
  };

  const handleSendWhatsApp = (quote: any) => {
    let message = `*Cotización - Distrielectricos EYD*\n\n`;
    message += `Hola ${quote.clientName || ""}, aquí tienes la cotización solicitada:\n\n`;
    
    quote.items.forEach((item: any) => {
      message += `- ${item.quantity}x ${item.product.name} a $${item.pvpPrice.toLocaleString()} c/u\n`;
    });
    
    message += `\n*TOTAL: $${quote.totalPvp.toLocaleString()}*\n\n`;
    message += `(Este mensaje es informativo, puedes descargar el PDF formal adjunto).`;

    const url = `https://wa.me/${quote.clientPhone?.replace(/[^0-9]/g, "") || ""}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta cotización?")) return;
    try {
      const { deleteExpertQuote } = await import("@/actions/expert-quotes");
      const res = await deleteExpertQuote(id);
      if (res.success) {
        setQuoteList(quoteList.filter(q => q.id !== id));
        toast.success("Cotización eliminada");
      } else {
        toast.error("Error al eliminar");
      }
    } catch (e) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>Mis Cotizaciones</h1>
          <p style={{ color: "var(--color-text-muted)" }}>Administra las cotizaciones guardadas para tus clientes finales.</p>
        </div>
        <Link href="/aliados/catalogo-mayorista" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem" }}>
          <ArrowLeft size={18} /> Volver al Catálogo
        </Link>
      </div>

      {quoteList.length === 0 ? (
        <div className="card" style={{ padding: "4rem", textAlign: "center", color: "var(--color-text-muted)" }}>
          <FileText size={64} style={{ margin: "0 auto 1rem", opacity: 0.2 }} />
          <h3>No tienes cotizaciones guardadas</h3>
          <p>Ve al catálogo mayorista, agrega productos al carrito y selecciona "Guardar Cotización".</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {quoteList.map((quote) => (
            <div key={quote.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "0.25rem" }}>
                  {quote.clientName}
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                  {new Date(quote.createdAt).toLocaleDateString('es-CO')} • {quote.items.length} productos
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--color-secondary)" }}>
                  ${quote.totalPvp.toLocaleString('de-DE')} <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 500 }}>(PVP)</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button 
                  onClick={() => handleDownload(quote)}
                  className="btn btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem" }}
                  title="Descargar PDF"
                >
                  <Download size={18} /> PDF
                </button>
                <button 
                  onClick={() => handleSendWhatsApp(quote)}
                  className="btn btn-secondary"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "#25D366", borderColor: "#25D366", color: "white" }}
                  title="Enviar por WhatsApp"
                >
                  <Send size={18} /> WhatsApp
                </button>
                <button 
                  onClick={() => handleDelete(quote.id)}
                  className="btn btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", color: "var(--color-danger)", borderColor: "transparent" }}
                  title="Eliminar"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
