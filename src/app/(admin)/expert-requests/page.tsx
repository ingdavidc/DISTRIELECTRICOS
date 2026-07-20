import { prisma } from "@/lib/prisma";
import { approveExpertRequest, rejectExpertRequest } from "@/actions/expert";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export default async function ExpertRequestsPage() {
  const requests = await prisma.expertRequest.findMany({
    orderBy: { createdAt: "desc" }
  });

  async function handleApprove(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await approveExpertRequest(id);
    revalidatePath("/expert-requests");
  }

  async function handleReject(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await rejectExpertRequest(id);
    revalidatePath("/expert-requests");
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "var(--color-primary)" }}>
        Solicitudes de Aliados Expertos
      </h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem" }}>
        Revisa, aprueba o rechaza el acceso al portal de Aliados Expertos. Las cuentas aprobadas crearán automáticamente un usuario con rol EXPERT.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--color-background-alt)", textAlign: "left" }}>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>Fecha</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>Nombre</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>Documento</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>Celular (WhatsApp)</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>Email</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>WhatsApp Verif.</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>Estado</th>
              <th style={{ padding: "1rem", borderBottom: "2px solid var(--color-border)" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                <td style={{ padding: "1rem" }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "1rem", fontWeight: 600 }}>{req.name}</td>
                <td style={{ padding: "1rem" }}>{req.document}</td>
                <td style={{ padding: "1rem" }}>{req.phone}</td>
                <td style={{ padding: "1rem" }}>{req.email}</td>
                <td style={{ padding: "1rem" }}>
                  {req.isVerified ? (
                    <span style={{ color: "var(--color-success)", fontWeight: 600 }}>✅ Verificado</span>
                  ) : (
                    <span style={{ color: "var(--color-danger)" }}>❌ Pendiente</span>
                  )}
                </td>
                <td style={{ padding: "1rem" }}>
                  <span style={{ 
                    padding: "0.25rem 0.5rem", borderRadius: "9999px", fontSize: "0.75rem", fontWeight: 600,
                    background: req.status === "APPROVED" ? "var(--color-success)" : req.status === "REJECTED" ? "var(--color-danger)" : "var(--color-warning)",
                    color: "white"
                  }}>
                    {req.status}
                  </span>
                </td>
                <td style={{ padding: "1rem", display: "flex", gap: "0.5rem" }}>
                  {req.status === "PENDING" && (
                    <>
                      <form action={handleApprove}>
                        <input type="hidden" name="id" value={req.id} />
                        <button 
                          type="submit" 
                          disabled={!req.isVerified}
                          className="btn btn-primary" 
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", opacity: req.isVerified ? 1 : 0.5 }}
                          title={!req.isVerified ? "Requiere verificación por WhatsApp primero" : ""}
                        >
                          Aprobar
                        </button>
                      </form>
                      <form action={handleReject}>
                        <input type="hidden" name="id" value={req.id} />
                        <button type="submit" className="btn btn-danger" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                          Rechazar
                        </button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                  No hay solicitudes en este momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
