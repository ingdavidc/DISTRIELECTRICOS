"use client";

import { logOut } from "@/actions/auth";
import { User, LogOut, Package, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfileClient({ user, orders }: { user: any, orders: any[] }) {
  const router = useRouter();
  const isAdminOrStaff = user.role && user.role !== "CUSTOMER";

  return (
    <div style={{ display: "grid", gap: "2rem", gridTemplateColumns: "1fr 2fr" }} className="md:grid-cols-3 grid-cols-1">
      {/* Sidebar / User Info */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignSelf: "start" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", fontWeight: 700, margin: "0 auto 1rem auto" }}>
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>
            {user.name || "Usuario"}
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>{user.email}</p>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-main)", padding: "0.5rem", background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-md)" }}>
            <User size={18} color="var(--color-primary)" />
            <span><strong>Rol:</strong> {user.role === "CUSTOMER" ? "Cliente Web" : user.role}</span>
          </div>
        </div>

        {isAdminOrStaff && (
          user.role === "EXPERT" ? (
            <Link href="/aliados/dashboard" className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none", background: "var(--color-secondary)", color: "white" }}>
              <Settings size={18} />
              Mi Portal de Aliado
            </Link>
          ) : (
            <Link href="/dashboard" className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none" }}>
              <Settings size={18} />
              Ir al Panel ERP
            </Link>
          )
        )}

        <button 
          onClick={async () => { await logOut(); router.push("/"); }}
          className="btn btn-outline" 
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>

      {/* Main Content / Orders */}
      <div style={{ gridColumn: "span 2" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "2rem" }}>
          Mi Historial de Compras
        </h1>

        {orders.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
            <Package size={48} color="var(--color-medium-gray)" style={{ margin: "0 auto 1rem auto" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>Aún no tienes pedidos</h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>Tus compras web aparecerán aquí.</p>
            <Link href="/catalog" className="btn btn-secondary" style={{ textDecoration: "none" }}>Ir de Compras</Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {orders.map(order => (
              <div key={order.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "1.1rem", marginBottom: "0.25rem" }}>Pedido #{order.id.slice(0,8).toUpperCase()}</div>
                  <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>${order.total.toLocaleString()}</span>
                    <span style={{ fontSize: "0.8rem", padding: "0.2rem 0.5rem", borderRadius: "1rem", background: "var(--color-background)", fontWeight: 600 }}>
                      {order.status}
                    </span>
                  </div>
                </div>
                <Link href={`/receipt/${order.id}`} className="btn btn-outline" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  Ver Detalle <ExternalLink size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
