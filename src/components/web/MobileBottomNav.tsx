"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, User, Zap } from "lucide-react";
import { useCart } from "./CartContext";

export default function MobileBottomNav({ expertUser, b2bUser }: { expertUser?: any, b2bUser?: any }) {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();

  return (
    <nav className="mobile-bottom-nav">
      <Link href="/" className={`mobile-nav-item ${pathname === "/" ? "active" : ""}`}>
        <Home size={20} />
        <span>Inicio</span>
      </Link>
      <Link href="/catalog" className={`mobile-nav-item ${pathname.startsWith("/catalog") && !pathname.includes("flash") ? "active" : ""}`}>
        <LayoutGrid size={20} />
        <span>Catálogo</span>
      </Link>
      <Link href="/catalog?flash=true" className={`mobile-nav-item ${pathname.includes("flash") ? "active" : ""}`}>
        <Zap size={20} color="var(--color-secondary)" />
        <span style={{ color: "var(--color-secondary)", fontWeight: 700 }}>Ofertas</span>
      </Link>
      <button 
        type="button" 
        onClick={openCart} 
        className="mobile-nav-item mobile-nav-cart"
        aria-label="Ver carrito de compras"
      >
        <div style={{ position: "relative", display: "inline-flex" }}>
          <ShoppingCart size={21} />
          {totalItems > 0 && (
            <span className="mobile-nav-badge">{totalItems}</span>
          )}
        </div>
        <span>Carrito</span>
      </button>
      <Link 
        href={b2bUser ? "/#b2b-login" : expertUser ? "/aliados/dashboard" : "/profile"} 
        className={`mobile-nav-item ${pathname.startsWith("/profile") || pathname.startsWith("/aliados") ? "active" : ""}`}
      >
        <User size={20} />
        <span>{expertUser ? "Aliado" : b2bUser ? "B2B" : "Cuenta"}</span>
      </Link>
    </nav>
  );
}
