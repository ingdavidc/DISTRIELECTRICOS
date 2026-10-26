"use client";

import { logOut } from "@/actions/auth";
import { User, LogOut, Package, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ProfileClient({ user, orders }: { user: any, orders: any[] }) {
  const router = useRouter();
  const isAdminOrStaff = user.role && user.role !== "CUSTOMER";

  return (
    <div className="profile-container">
      <div className="profile-grid">
        {/* Sidebar / User Info */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignSelf: "start" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "var(--color-primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 700, margin: "0 auto 0.75rem auto" }}>
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.2rem" }}>
              {user.name || "Usuario"}
            </h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{user.email}</p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-main)", padding: "0.5rem", background: "rgba(0,0,0,0.02)", borderRadius: "var(--radius-md)", fontSize: "0.9rem" }}>
              <User size={18} color="var(--color-primary)" />
              <span><strong>Rol:</strong> {user.role === "CUSTOMER" ? "Cliente Web" : user.role}</span>
            </div>
          </div>

          {isAdminOrStaff && (
            user.role === "EXPERT" ? (
              <Link href="/aliados/dashboard" className="btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none", background: "var(--color-secondary)", color: "white", fontSize: "0.9rem" }}>
                <Settings size={18} />
                Mi Portal de Aliado
              </Link>
            ) : (
              <Link href="/dashboard" className="btn btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none", fontSize: "0.9rem" }}>
                <Settings size={18} />
                Ir al Panel ERP
              </Link>
            )
          )}

          <button 
            onClick={async () => { await logOut(); router.push("/"); }}
            className="btn btn-outline" 
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--color-danger)", borderColor: "var(--color-danger)", fontSize: "0.9rem" }}
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>

        {/* Main Content / Orders */}
        <div className="profile-orders-area">
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "1.5rem" }}>
            Mi Historial de Compras
          </h1>

          {orders.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
              <Package size={44} color="var(--color-medium-gray)" style={{ margin: "0 auto 1rem auto" }} />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 600, marginBottom: "0.5rem" }}>Aún no tienes pedidos</h3>
              <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem", fontSize: "0.9rem" }}>Tus compras web aparecerán aquí.</p>
              <Link href="/catalog" className="btn btn-secondary" style={{ textDecoration: "none" }}>Ir de Compras</Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {orders.map(order => (
                <div key={order.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", padding: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.2rem", color: "var(--color-primary)" }}>
                      Pedido #{order.id.slice(0,8).toUpperCase()}
                    </div>
                    <div style={{ color: "var(--color-text-muted)", fontSize: "0.8rem", marginBottom: "0.4rem" }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "0.95rem" }}>${order.total.toLocaleString('de-DE')}</span>
                      <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "1rem", background: "var(--color-background)", fontWeight: 600 }}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <Link href={`/receipt/${order.id}`} className="btn btn-outline" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.85rem", padding: "0.45rem 0.85rem" }}>
                    Ver Detalle <ExternalLink size={15} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
