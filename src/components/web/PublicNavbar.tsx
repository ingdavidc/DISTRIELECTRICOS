"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, User, Phone } from "lucide-react";
import { useCart } from "./CartContext";

export default function PublicNavbar() {
  const { totalItems, totalPrice, openCart } = useCart();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchTerm)}`);
    } else {
      router.push(`/catalog`);
    }
  };

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "white", boxShadow: "var(--shadow-sm)" }}>
      {/* Top Bar for B2B/Contact */}
      <div style={{ background: "var(--color-primary)", color: "white", padding: "0.5rem 2rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link href="/cotizar" style={{ color: "white", textDecoration: "none" }}>Ventas Corporativas B2B</Link>
          <Link href="/cotizar" style={{ color: "white", textDecoration: "none" }}>Cotiza tus Proyectos</Link>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Phone size={14} />
          <span>Línea Gratuita: 01 8000 123 456</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div style={{ padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem" }}>
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="logo-electric"
            style={{ height: "45px", width: "45px", objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "var(--color-primary)", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
              DISTRIELECTRICOS <span style={{ color: "var(--color-secondary)" }}>E&D</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: "1px" }}>
              IDEAS CON ENERGÍA
            </div>
          </div>
        </Link>

        {/* Predictive Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: "600px", position: "relative" }}>
          <Search size={20} style={{ position: "absolute", left: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="¿Qué estás buscando para tu proyecto?" 
            style={{ 
              width: "100%", padding: "0.85rem 1rem 0.85rem 3rem", 
              borderRadius: "9999px", border: "2px solid var(--color-primary)", 
              fontSize: "1rem", outline: "none", transition: "all 0.2s"
            }}
          />
          <button type="submit" style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)", background: "var(--color-secondary)", color: "white", padding: "0.5rem 1.5rem", borderRadius: "9999px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            Buscar
          </button>
        </form>

        {/* User Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/profile" style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--color-primary)", gap: "0.25rem", textDecoration: "none" }}>
            <User size={24} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Mi Cuenta</span>
          </Link>
          <div 
            onClick={openCart}
            style={{ position: "relative", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", color: "var(--color-primary)", gap: "0.25rem" }}
          >
            <div style={{ position: "relative" }}>
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "var(--color-secondary)", color: "white", fontSize: "0.75rem", fontWeight: "bold", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {totalItems}
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>${totalPrice.toLocaleString('de-DE')}</span>
          </div>
        </div>
      </div>

      {/* Navigation Categories */}
      <nav style={{ borderTop: "1px solid var(--color-border)", padding: "0.75rem 2rem", display: "flex", gap: "2rem", overflowX: "auto" }}>
        <Link href="/catalog" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
          <Menu size={20} />
          Todos los Departamentos
        </Link>
        <div style={{ width: "1px", background: "var(--color-border)" }}></div>
        <Link href="/catalog?category=11651069-bb4d-477b-9d77-afac5495b18f" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Iluminación</Link>
        <Link href="/catalog?category=d66cb982-eebc-49b5-944c-b2f56a76f8a8" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Conductores Eléctricos</Link>
        <Link href="/catalog?category=18811ae2-62ea-45c5-b410-fce91ff5d585" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Aparamenta</Link>
        <Link href="/catalog?category=3bdc7419-5e3c-4537-a360-d774e8964ea7" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Tubería y Accesorios</Link>
        <Link href="/catalog?flash=true" style={{ textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, color: "var(--color-danger)" }}>Ofertas Flash</Link>
      </nav>
    </header>
  );
}
