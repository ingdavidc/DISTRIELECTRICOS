"use client";

import React, { useState } from "react";
import { Search, FileText, Printer, FileDown, CheckCircle, Smartphone } from "lucide-react";
import QuotePrint from "./QuotePrint";

export default function QuotesCashierTab({ quotes }: { quotes: any[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<any | null>(null);
  const [printFormat, setPrintFormat] = useState<"LETTER" | "HALF_LETTER">("LETTER");
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const filteredQuotes = quotes.filter((q: any) => {
    const term = searchQuery.toLowerCase();
    return q.quoteNumber?.toLowerCase().includes(term) || q.customer?.name?.toLowerCase().includes(term) || q.customer?.identification?.includes(term);
  });

  const handlePrint = (format: "LETTER" | "HALF_LETTER") => {
    if (!selectedQuote) return;
    setPrintFormat(format);
    setIsPrintReady(true);
    setTimeout(() => {
      window.print();
      setIsPrintReady(false);
    }, 500);
  };

  const handleWhatsApp = () => {
    // Aquí podemos disparar la integración de PDF + WhatsApp
    // Como es asíncrono y requiere un backend de PDF, por ahora alertaremos
    if (!selectedQuote?.customer?.phone) {
      alert("El cliente no tiene teléfono registrado.");
      return;
    }
    const phone = selectedQuote.customer.phone;
    const text = `Hola ${selectedQuote.customer.name}, adjunto la cotización ${selectedQuote.quoteNumber}. Total: $${selectedQuote.totalAmount.toLocaleString('de-DE')}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px - 4rem - 50px)", gap: "1.5rem" }}>
      
      {/* LEFT COLUMN: QUOTES LIST */}
      <div className="card" style={{ flex: "1 1 40%", display: "flex", flexDirection: "column", padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-background)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={20} />
              Cotizaciones Pendientes
            </h2>
            <span className="badge badge-secondary" style={{ fontSize: "1rem", padding: "0.5rem 1rem" }}>{quotes.length}</span>
          </div>

          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Buscar cotización por N° o Cliente..." 
              style={{ paddingLeft: "2.25rem", width: "100%" }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredQuotes.length === 0 ? (
             <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
               No se encontraron cotizaciones.
             </div>
          ) : (
            filteredQuotes.map((quote: any) => (
              <div 
                key={quote.id} 
                onClick={() => setSelectedQuote(quote)}
                style={{ 
                  border: `2px solid ${selectedQuote?.id === quote.id ? 'var(--color-primary)' : 'var(--color-border)'}`, 
                  borderRadius: "var(--radius-md)", 
                  padding: "1rem",
                  cursor: "pointer",
                  background: selectedQuote?.id === quote.id ? 'var(--color-surface)' : 'white',
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--color-text-main)" }}>
                    {quote.quoteNumber}
                  </div>
                  <span className="badge" style={{ background: "var(--color-secondary)", color: "white" }}>Cotización</span>
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
                  <strong>Cliente:</strong> {quote.customer?.name || "Consumidor Final"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  <span>{new Date(quote.createdAt).toLocaleString()}</span>
                  <span style={{ fontWeight: 600, color: "var(--color-primary)" }}>${quote.totalAmount.toLocaleString('de-DE')}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIONS */}
      <div className="card" style={{ flex: "1 1 60%", padding: "1.5rem", display: "flex", flexDirection: "column", background: "white" }}>
        {!selectedQuote ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--color-text-muted)", gap: "1rem" }}>
            <FileText size={48} opacity={0.2} />
            <p>Selecciona una cotización para imprimir o enviar</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                  {selectedQuote.quoteNumber}
                </h2>
                <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                  <strong>Cliente:</strong> {selectedQuote.customer?.name || "Consumidor Final"} <br/>
                  <strong>CC/NIT:</strong> {selectedQuote.customer?.identification || "N/A"} <br/>
                  <strong>Tel:</strong> {selectedQuote.customer?.phone || "N/A"}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>
                  ${selectedQuote.totalAmount.toLocaleString('de-DE')}
                </div>
                <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                  {selectedQuote.items.length} artículos
                </div>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "1rem" }}>Opciones de Exportación</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                <button 
                  className="btn btn-primary" 
                  style={{ padding: "1.5rem", display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "1rem", fontSize: "1.1rem" }}
                  onClick={() => setIsPreviewModalOpen(true)}
                >
                  <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.75rem", borderRadius: "50%" }}>
                    <Printer size={24} color="white" />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600 }}>Vista Previa e Imprimir</div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>Visualiza la cotización y elige el tamaño de papel</div>
                  </div>
                </button>

                <button 
                  className="btn btn-outline" 
                  style={{ padding: "1.5rem", display: "flex", justifyContent: "flex-start", alignItems: "center", gap: "1rem", fontSize: "1.1rem" }}
                  onClick={handleWhatsApp}
                >
                  <div style={{ background: "#e8f5e9", padding: "0.75rem", borderRadius: "50%" }}>
                    <Smartphone size={24} color="#2e7d32" />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600 }}>Enviar por WhatsApp</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Genera PDF y abre chat con el cliente</div>
                  </div>
                </button>

              </div>
            </div>
            
            {isPrintReady && (
              <QuotePrint quote={selectedQuote} format={printFormat} />
            )}

            {/* Preview Modal */}
            {isPreviewModalOpen && (
              <div className="modal-overlay" style={{ zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}>
                <div className="modal-content" style={{ maxWidth: "800px", width: "95%", height: "90vh", display: "flex", flexDirection: "column", background: "#f0f4f8" }}>
                  <div className="modal-header" style={{ background: "white", padding: "1rem 1.5rem", borderBottom: "1px solid #ccc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className="modal-title" style={{ fontSize: "1.25rem", margin: 0 }}>Vista Previa de Cotización</h2>
                    <button className="btn-close" onClick={() => setIsPreviewModalOpen(false)}>×</button>
                  </div>
                  
                  <div style={{ padding: "1rem", display: "flex", justifyContent: "center", gap: "1rem", background: "white", borderBottom: "1px solid #ccc" }}>
                    <button 
                      className={`btn ${printFormat === "LETTER" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setPrintFormat("LETTER")}
                    >
                      Tamaño CARTA (8.5" x 11")
                    </button>
                    <button 
                      className={`btn ${printFormat === "HALF_LETTER" ? "btn-primary" : "btn-outline"}`}
                      onClick={() => setPrintFormat("HALF_LETTER")}
                    >
                      Tamaño MEDIA CARTA (8.5" x 5.5")
                    </button>
                  </div>

                  <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
                    <QuotePrint quote={selectedQuote} format={printFormat} previewMode={true} />
                  </div>

                  <div style={{ padding: "1rem 1.5rem", background: "white", borderTop: "1px solid #ccc", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
                    <button className="btn btn-outline" onClick={() => setIsPreviewModalOpen(false)}>Cancelar</button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => {
                        setIsPrintReady(true);
                        setTimeout(() => {
                          window.print();
                          setIsPrintReady(false);
                          setIsPreviewModalOpen(false);
                        }, 500);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <Printer size={20} />
                      Imprimir Ahora
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
