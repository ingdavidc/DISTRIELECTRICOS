import { getExpertUser } from "@/actions/expert";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Calculator, ShoppingBag, FileText, Settings } from "lucide-react";

export default async function ExpertDashboard() {
  const user = await getExpertUser();
  if (!user) {
    redirect("/aliados");
  }

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "1200px", margin: "0 auto", minHeight: "80vh" }}>
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)" }}>
          Hola, {user.name} 👋
        </h1>
        <p style={{ color: "var(--color-text-muted)" }}>
          Bienvenido a tu panel de Aliado Experto. ¿Qué deseas hacer hoy?
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
        
        {/* Catálogo con Descuento */}
        <Link href="/catalog" className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", textDecoration: "none", color: "inherit", transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ background: "var(--color-background-alt)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
            <ShoppingBag size={30} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)" }}>Catálogo Mayorista</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Navega por nuestro inventario y compra materiales para ti con tus precios y descuentos exclusivos de Aliado Experto ya aplicados.
          </p>
        </Link>

        {/* Cotizador para Clientes Finales */}
        <Link href="/aliados/cotizador" className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", textDecoration: "none", color: "inherit", transition: "transform 0.2s", border: "2px solid var(--color-secondary)" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
          <div style={{ background: "var(--color-secondary)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <Calculator size={30} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-secondary)" }}>Cotizar a Cliente Final</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Arma cotizaciones profesionales en PDF para tus clientes usando los <strong>precios base de venta al público</strong> (PVP) sin mostrar tus descuentos.
          </p>
        </Link>

        {/* Perfil */}
        <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem", opacity: 0.7 }}>
          <div style={{ background: "var(--color-background-alt)", width: "60px", height: "60px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}>
            <Settings size={30} />
          </div>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)" }}>Mi Perfil (Próximamente)</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
            Actualiza tus datos de contacto y revisa el historial de cotizaciones que has generado.
          </p>
        </div>

      </div>
    </div>
  );
}
