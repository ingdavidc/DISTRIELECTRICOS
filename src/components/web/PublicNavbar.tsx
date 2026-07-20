"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, User, Phone, X, LayoutGrid, Zap } from "lucide-react";
import { useCart } from "./CartContext";
import { signOut } from "next-auth/react";

import { loginB2B, logoutB2B } from "@/actions/b2b-login";
import toast from "react-hot-toast";

export default function PublicNavbar({ b2bUser, expertUser }: { b2bUser?: any, expertUser?: any }) {
  const { totalItems, totalPrice, openCart } = useCart();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showB2BModal, setShowB2BModal] = useState(false);
  const [clientCode, setClientCode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleB2BLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await loginB2B(clientCode);
      if (res.success) {
        toast.success(`Bienvenido, ${res.companyName}`);
        setShowB2BModal(false);
        router.refresh();
      } else {
        toast.error(res.error || "Código inválido");
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleB2BLogout = async () => {
    await logoutB2B();
    toast.success("Sesión cerrada");
    router.refresh();
  };

  const handleExpertLogout = async () => {
    toast.success("Sesión cerrada");
    await signOut({ callbackUrl: '/' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/catalog?q=${encodeURIComponent(searchTerm)}`);
    } else {
      router.push(`/catalog`);
    }
  };

  return (
    <>
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: "white", boxShadow: "var(--shadow-sm)" }}>
      {/* Top Bar for B2B/Contact */}
      <div className="navbar-top" style={{ background: "var(--color-primary)", color: "white", padding: "0.5rem 2rem", display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {b2bUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontWeight: 600, color: "var(--color-secondary)" }}>
                🏢 B2B: {b2bUser.companyName}
              </span>
              <button onClick={handleB2BLogout} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}>
                Cerrar Sesión
              </button>
            </div>
          ) : expertUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontWeight: 600, color: "var(--color-secondary)" }}>
                ⚡ Aliado: {expertUser.name}
              </span>
              <Link href="/aliados/cotizador" style={{ color: "white", textDecoration: "underline", fontSize: "0.75rem" }}>Ir al Cotizador</Link>
              <button onClick={handleExpertLogout} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", fontSize: "0.75rem", textDecoration: "underline" }}>
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <button onClick={() => setShowB2BModal(true)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 600 }}>
              <User size={14} /> Acceso B2B
            </button>
          )}
          {!b2bUser && !expertUser && (
            <>
              <Link href="/cotizar" style={{ color: "white", textDecoration: "none" }}>Solicitar B2B</Link>
              <Link href="/aliados" style={{ color: "white", textDecoration: "none" }}>Portal Aliados Expertos</Link>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Phone size={14} />
          <span>Línea Gratuita: 01 8000 123 456</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="navbar-main" style={{ padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "2rem" }}>
        
        <div className="navbar-header-mobile">
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

          {/* Mobile Right Icons (Hamburger & Cart) */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }} className="mobile-menu-btn">
            <div onClick={openCart} style={{ position: "relative", cursor: "pointer", color: "var(--color-primary)" }}>
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "var(--color-secondary)", color: "white", fontSize: "0.75rem", fontWeight: "bold", width: "20px", height: "20px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {totalItems}
                </span>
              )}
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="mobile-menu-btn" style={{ display: "block" }}>
              <Menu size={28} />
            </button>
          </div>
        </div>

        {/* Predictive Search Bar */}
        <form onSubmit={handleSearch} className="navbar-search" style={{ flex: 1, maxWidth: "600px", position: "relative" }}>
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
        <div className="navbar-actions" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
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
      <nav className="categories-nav" style={{ borderTop: "1px solid var(--color-border)", padding: "0.75rem 2rem", display: "flex", gap: "2rem", overflowX: "auto" }}>
        <Link href="/catalog" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, color: "var(--color-primary)", textDecoration: "none" }}>
          <LayoutGrid size={20} />
          Todos los Departamentos
        </Link>
        <div style={{ width: "1px", background: "var(--color-border)" }}></div>
        <Link href="/catalog?category=11651069-bb4d-477b-9d77-afac5495b18f" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Iluminación</Link>
        <Link href="/catalog?category=204a74cb-97b1-4554-9bee-4d5b71dfc000" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Conductores Eléctricos</Link>
        <Link href="/catalog?category=18811ae2-62ea-45c5-b410-fce91ff5d585" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Aparamenta</Link>
        <Link href="/catalog?category=3bdc7419-5e3c-4537-a360-d774e8964ea7" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none" }}>Tubería y Accesorios</Link>
        <a href="/catalog?flash=true" style={{ textDecoration: "none", fontSize: "0.9rem", fontWeight: 500, color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          <Zap size={16} /> Ofertas Flash
        </a>
      </nav>
    </header>
    
    {/* Hamburger Menu Overlay */}
    {isMobileMenuOpen && (
      <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "1.2rem" }}>Menú</span>
            <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)" }}>
              <X size={24} />
            </button>
          </div>
          
          <nav style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {b2bUser ? (
              <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ fontWeight: 600, color: "var(--color-secondary)", marginBottom: "0.5rem" }}>🏢 B2B: {b2bUser.companyName}</div>
                <button onClick={handleB2BLogout} style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}>Cerrar Sesión B2B</button>
              </div>
            ) : expertUser ? (
              <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ fontWeight: 600, color: "var(--color-secondary)", marginBottom: "0.5rem" }}>⚡ Aliado: {expertUser.name}</div>
                <Link href="/aliados/cotizador" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "block", marginBottom: "0.5rem", color: "var(--color-primary)", fontWeight: 600 }}>Ir al Cotizador</Link>
                <button onClick={handleExpertLogout} style={{ color: "var(--color-text-muted)", textDecoration: "underline" }}>Cerrar Sesión Aliado</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                <button onClick={() => { setIsMobileMenuOpen(false); setShowB2BModal(true); }} className="btn btn-outline" style={{ justifyContent: "center" }}>
                  <User size={18} /> Acceso B2B
                </button>
                <Link href="/aliados" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ justifyContent: "center" }}>Portal Aliados</Link>
              </div>
            )}

            <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 600, color: "var(--color-primary)" }}>
              <LayoutGrid size={20} /> Todos los Departamentos
            </Link>
            <Link href="/catalog?category=11651069-bb4d-477b-9d77-afac5495b18f" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500 }}>Iluminación</Link>
            <Link href="/catalog?category=204a74cb-97b1-4554-9bee-4d5b71dfc000" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500 }}>Conductores Eléctricos</Link>
            <Link href="/catalog?category=18811ae2-62ea-45c5-b410-fce91ff5d585" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500 }}>Aparamenta</Link>
            <Link href="/catalog?category=3bdc7419-5e3c-4537-a360-d774e8964ea7" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500 }}>Tubería y Accesorios</Link>
            <Link href="/catalog?flash=true" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--color-danger)", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={18} /> Ofertas Flash
            </Link>

            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
              <User size={20} /> Mi Cuenta
            </Link>
          </nav>
        </div>
      </div>
    )}
    
    {/* Modal de B2B */}
    {showB2BModal && (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "1rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2rem", position: "relative" }}>
          <button 
            onClick={() => setShowB2BModal(false)}
            style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "var(--color-text-muted)" }}
          >
            &times;
          </button>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary)", textAlign: "center" }}>Acceso Corporativo</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "1.5rem" }}>
            Ingresa tu código único para acceder a los precios especiales.
          </p>
          <form onSubmit={handleB2BLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <input 
                required
                type="text" 
                className="input" 
                placeholder="Ej: CORP-ABCD"
                value={clientCode}
                onChange={e => setClientCode(e.target.value)}
                style={{ textAlign: "center", letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoggingIn} style={{ padding: "0.75rem", fontWeight: 600 }}>
              {isLoggingIn ? "Verificando..." : "Ingresar"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/cotizar" onClick={() => setShowB2BModal(false)} style={{ fontSize: "0.85rem", color: "var(--color-secondary)", fontWeight: 600 }}>
              ¿No tienes código? Solicítalo aquí
            </Link>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
