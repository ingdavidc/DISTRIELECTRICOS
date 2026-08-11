"use client";
import { useState, useEffect } from "react";
import { Search, Play } from "lucide-react";
import { getQuotes } from "@/actions/payments";
import toast from "react-hot-toast";

export default function QuotesPosTab({ onResumeQuote }: { onResumeQuote: (quote: any) => void }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotes();
      setQuotes(data);
    } catch (e) {
      toast.error("Error al cargar cotizaciones");
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = quotes.filter(q => {
    const term = searchQuery.toLowerCase();
    return q.quoteNumber?.toLowerCase().includes(term) || q.customer?.name?.toLowerCase().includes(term) || q.customer?.identification?.toLowerCase().includes(term);
  });

  return (
    <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column", padding: 0 }}>
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: "1rem" }}>Retomar Cotización</h2>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input type="text" className="form-input" placeholder="Buscar por cliente, documento o número..." style={{ paddingLeft: "2.25rem" }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem" }}>
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>Cargando...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>No se encontraron cotizaciones.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filtered.map(q => (
              <div key={q.id} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-text-main)", display: "flex", gap: "0.5rem", alignItems: "center", fontSize: "1.1rem" }}>
                    {q.quoteNumber} <span className="badge badge-warning" style={{ fontSize: "0.75rem" }}>Cotización</span>
                  </div>
                  <div style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                    Cliente: {q.customer?.name || "Consumidor Final"} {q.customer?.identification && `(${q.customer.identification})`}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "0.25rem" }}>
                    Fecha: {new Date(q.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <button className="btn btn-primary" onClick={() => onResumeQuote(q)} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Play size={16} /> Retomar Venta
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
