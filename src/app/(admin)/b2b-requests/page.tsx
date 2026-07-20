"use client";

import { useState, useEffect } from "react";
import { Check, X, Search, FileText, Loader2, Building, Phone, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { getB2BRequests, approveB2BRequest, rejectB2BRequest } from "@/actions/b2b";

export default function B2BRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getB2BRequests();
      setRequests(data);
    } catch (e: any) {
      toast.error(e.message || "Error al cargar");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`¿Aprobar cliente corporativo ${name}? Se enviará un WhatsApp con su código.`)) return;
    const tid = toast.loading("Aprobando...");
    const res = await approveB2BRequest(id);
    if (res.success) {
      toast.success("Aprobado correctamente. Código generado: " + res.clientCode, { id: tid });
      loadData();
    } else {
      toast.error(res.error || "Error al aprobar", { id: tid });
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`¿Rechazar solicitud de ${name}?`)) return;
    const tid = toast.loading("Rechazando...");
    const res = await rejectB2BRequest(id);
    if (res.success) {
      toast.success("Solicitud rechazada", { id: tid });
      loadData();
    } else {
      toast.error(res.error || "Error al rechazar", { id: tid });
    }
  };

  const filtered = requests.filter(r => 
    r.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.nit.includes(searchTerm) ||
    r.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Building size={28} />
            Clientes Corporativos
          </h1>
          <p style={{ color: "var(--color-text-muted)" }}>Gestiona las solicitudes B2B y aprueba precios especiales.</p>
        </div>
      </div>

      <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem", display: "flex", gap: "1rem" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
          <Search size={20} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
          <input 
            type="text" 
            className="input" 
            placeholder="Buscar por Empresa, NIT o Contacto..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "40px" }}
          />
        </div>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <Loader2 className="spinner" size={40} color="var(--color-primary)" />
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--color-background)", borderBottom: "2px solid var(--color-border)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>Empresa / NIT</th>
                <th style={{ padding: "1rem", textAlign: "left", fontWeight: 600 }}>Contacto</th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: 600 }}>Documento (RUT)</th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: 600 }}>WhatsApp OTP</th>
                <th style={{ padding: "1rem", textAlign: "center", fontWeight: 600 }}>Estado</th>
                <th style={{ padding: "1rem", textAlign: "right", fontWeight: 600 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                    No hay solicitudes para mostrar.
                  </td>
                </tr>
              )}
              {filtered.map(req => (
                <tr key={req.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 600 }}>{req.companyName}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>NIT: {req.nit}</div>
                    {req.clientCode && <div style={{ fontSize: "0.85rem", color: "var(--color-primary)", fontWeight: 700 }}>Código: {req.clientCode}</div>}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {req.contactName}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
                      <Phone size={12} /> {req.phone}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Mail size={12} /> {req.email}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {req.rutUrl ? (
                      <a href={req.rutUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-secondary)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                        <FileText size={16} /> Ver RUT
                      </a>
                    ) : (
                      <span style={{ color: "var(--color-medium-gray)", fontSize: "0.85rem" }}>Sin RUT</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {req.isVerified ? (
                      <span style={{ background: "#dcfce7", color: "#166534", padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>Verificado</span>
                    ) : (
                      <span style={{ background: "#fee2e2", color: "#991b1b", padding: "0.25rem 0.5rem", borderRadius: "1rem", fontSize: "0.75rem", fontWeight: 600 }}>Sin Verificar</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    {req.status === "APPROVED" ? (
                      <span style={{ color: "#16a34a", fontWeight: 700 }}>Aprobado</span>
                    ) : req.status === "REJECTED" ? (
                      <span style={{ color: "#dc2626", fontWeight: 700 }}>Rechazado</span>
                    ) : (
                      <span style={{ color: "#d97706", fontWeight: 700 }}>Pendiente</span>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    {req.status === "PENDING" && (
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button className="btn btn-outline" style={{ padding: "0.4rem" }} title="Rechazar" onClick={() => handleReject(req.id, req.companyName)}>
                          <X size={18} color="var(--color-danger)" />
                        </button>
                        <button className="btn btn-primary" style={{ padding: "0.4rem" }} title="Aprobar" onClick={() => handleApprove(req.id, req.companyName)}>
                          <Check size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
