"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Users, LayoutDashboard, ShoppingCart, Truck, FileText, ClipboardList, Building2, Banknote } from "lucide-react";

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
    { name: "Punto de Venta", href: "/pos", icon: ShoppingCart, roles: ["ADMIN", "CASHIER"] },
    { name: "Caja / Pagos", href: "/payments", icon: Banknote, roles: ["ADMIN", "FINANCE"] },
    { name: "Clientes", href: "/customers", icon: Users, roles: ["ADMIN", "CASHIER"] },
    { name: "Inventario", href: "/inventory", icon: Package, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Despachos", href: "/dispatch", icon: Truck, roles: ["ADMIN", "WAREHOUSE"] },
    { name: "Cotizaciones", href: "/quotes", icon: FileText, roles: ["ADMIN"] },
    { name: "Órdenes de Compra", href: "/purchases", icon: ClipboardList, roles: ["ADMIN"] },
    { name: "Proveedores", href: "/suppliers", icon: Building2, roles: ["ADMIN"] },
    { name: "Recursos Humanos", href: "/hr", icon: Users, roles: ["ADMIN"] },
  ];

  const filteredNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-text">DISTRIELECTRICOS</div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)" }}>
          IDEAS CON ENERGÍA
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
