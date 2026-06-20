"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Users, LayoutDashboard, ShoppingCart, Truck, FileText, ClipboardList, Building2, Banknote } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Punto de Venta", href: "/pos", icon: ShoppingCart },
    { name: "Caja / Pagos", href: "/payments", icon: Banknote },
    { name: "Clientes", href: "/customers", icon: Users },
    { name: "Inventario", href: "/inventory", icon: Package },
    { name: "Despachos", href: "/dispatch", icon: Truck },
    { name: "Cotizaciones", href: "/quotes", icon: FileText },
    { name: "Órdenes de Compra", href: "/purchases", icon: ClipboardList },
    { name: "Proveedores", href: "/suppliers", icon: Building2 },
    { name: "Recursos Humanos", href: "/hr", icon: Users },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo-text">DISTRIELECTRICOS</div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)" }}>
          IDEAS CON ENERGÍA
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
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
