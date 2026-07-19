"use client";

import { useState } from "react";
import { updateQuoteStatus } from "@/actions/quotes";
import { Search, Mail, Phone, Building2, CheckCircle, Clock, XCircle, FileText } from "lucide-react";

export default function QuotesClient({ initialQuotes }: { initialQuotes: any[] }) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [searchTerm, setSearchTerm] = useState("");

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateQuoteStatus(id, newStatus);
      setQuotes(quotes.map(q => q.id === id ? { ...q, status: newStatus } : q));
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  const filteredQuotes = quotes.filter(q => 
    q.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (q.company && q.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <span style={{ padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: 600, background: "#fff3cd", color: "#856404", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><Clock size={12}/> Pendiente</span>;
      case 'REVIEWED': return <span style={{ padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: 600, background: "#cce5ff", color: "#004085", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><FileText size={12}/> En Revisión</span>;
      case 'QUOTED': return <span style={{ padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: 600, background: "#d4edda", color: "#155724", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><CheckCircle size={12}/> Cotizado</span>;
      case 'REJECTED': return <span style={{ padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: 600, background: "#f8d7da", color: "#721c24", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}><XCircle size={12}/> Rechazado</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ position: "relative", width: "300px" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
          <input 
            type="text" 
            placeholder="Buscar por cliente o empresa..." 
            className="input" 
            style={{ paddingLeft: "2.5rem" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-background)", textAlign: "left" }}>
              <th style={{ padding: "1rem", fontWeight: 600 }}>Fecha</th>
              <th style={{ padding: "1rem", fontWeight: 600 }}>Cliente</th>
              <th style={{ padding: "1rem", fontWeight: 600 }}>Contacto</th>
              <th style={{ padding: "1rem", fontWeight: 600 }}>Estado</th>
              <th style={{ padding: "1rem", fontWeight: 600 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                  No se encontraron cotizaciones.
                </td>
              </tr>
            ) : (
              filteredQuotes.map(q => (
                <tr key={q.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "1rem" }}>{new Date(q.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600 }}>{q.name}</div>
                    {q.company && <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}><Building2 size={12}/> {q.company}</div>}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Phone size={12}/> {q.phone}</div>
                    {q.email && <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.25rem" }}><Mail size={12}/> {q.email}</div>}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    {getStatusBadge(q.status)}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <select 
                      className="input" 
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", width: "auto" }}
                      value={q.status}
                      onChange={(e) => handleStatusChange(q.id, e.target.value)}
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="REVIEWED">En Revisión</option>
                      <option value="QUOTED">Cotizado</option>
                      <option value="REJECTED">Rechazado</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .table th, .table td { border-bottom: 1px solid var(--color-border); }
        .table tbody tr:hover { background: rgba(0,0,0,0.02); }
      `}</style>
    </div>
  );
}
