"use client";

import { TrendingUp, Package, Users, ShoppingCart } from "lucide-react";

export default function Dashboard() {
  const stats = [
    { title: "Ventas de Hoy", value: "$1,245.000", icon: TrendingUp, color: "var(--color-success)" },
    { title: "Órdenes (POS)", value: "34", icon: ShoppingCart, color: "var(--color-primary)" },
    { title: "Alertas de Stock", value: "12", icon: Package, color: "var(--color-warning)" },
    { title: "Nuevos Clientes", value: "5", icon: Users, color: "var(--color-secondary)" },
  ];

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>
      
      <div className="grid-cards">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="card" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ background: "var(--color-light-gray)", padding: "1rem", borderRadius: "var(--radius-lg)" }}>
                <Icon size={32} color={stat.color} />
              </div>
              <div>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", fontWeight: 500 }}>{stat.title}</div>
                <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main)" }}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "1rem" }}>Últimos Movimientos</h2>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Orden</th>
                <th>Fecha</th>
                <th>Vendedor</th>
                <th>Tipo</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>#ORD-001</td>
                <td>17/06/2026</td>
                <td>Carlos Admin</td>
                <td>POS</td>
                <td>$45.000</td>
                <td><span className="badge badge-success">Completado</span></td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>#ORD-002</td>
                <td>17/06/2026</td>
                <td>Maria Ventas</td>
                <td>Cotización</td>
                <td>$120.000</td>
                <td><span className="badge badge-warning">Pendiente</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
