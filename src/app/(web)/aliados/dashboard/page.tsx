import { getExpertUser } from "@/actions/expert";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calculator, ShoppingBag, Settings } from "lucide-react";

export default async function ExpertDashboard() {
  // Accept EITHER the custom expert_session cookie OR a NextAuth session with EXPERT role
  const [cookieUser, session] = await Promise.all([
    getExpertUser(),
    auth(),
  ]);

  const isExpertSession = (session?.user as any)?.role === "EXPERT";
  const userName = cookieUser?.name ?? session?.user?.name ?? "Aliado";

  if (!cookieUser && !isExpertSession) {
    redirect("/aliados");
  }

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh" }}>
      <style>{`
        .expert-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .expert-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.12);
        }
      `}</style>

      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>
          Hola, {userName} 👋
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Bienvenido a tu panel de Aliado Experto. ¿Qué deseas hacer hoy?
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
        
        {/* Catálogo con Descuento */}
        <Link
          href="/aliados/catalogo-mayorista"
          className="card expert-card"
          style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", textDecoration: "none", color: "inherit" }}
        >
          <div style={{ background: "var(--color-background-alt)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
            <ShoppingBag size={30} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)" }}>Catálogo Mayorista</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Navega por nuestro inventario y compra materiales para ti con tus precios y descuentos exclusivos de Aliado Experto ya aplicados.
          </p>
        </Link>

        {/* Cotizador para Clientes Finales */}
        <Link
          href="/aliados/cotizador"
          className="card expert-card"
          style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", textDecoration: "none", color: "inherit", border: "2px solid var(--color-secondary)" }}
        >
          <div style={{ background: "var(--color-secondary)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <Calculator size={30} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-secondary)" }}>Cotizar a Cliente Final</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Arma cotizaciones profesionales en PDF para tus clientes usando los <strong>precios base de venta al público</strong> (PVP) sin mostrar tus descuentos.
          </p>
        </Link>

        {/* Cotizaciones Guardadas */}
        <Link
          href="/aliados/mis-cotizaciones"
          className="card expert-card"
          style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", textDecoration: "none", color: "inherit" }}
        >
          <div style={{ background: "var(--color-background-alt)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
            <Settings size={30} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)" }}>Mis Cotizaciones Guardadas</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Administra, descarga en PDF o envía por WhatsApp las cotizaciones que has guardado para tus clientes finales.
          </p>
        </Link>

      </div>
    </div>
  );
}
