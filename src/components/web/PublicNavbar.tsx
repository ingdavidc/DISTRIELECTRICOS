"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Search, Menu, User, Phone, X, LayoutGrid, Zap, Sparkles } from "lucide-react";
import { useCart } from "./CartContext";
import { signOut } from "next-auth/react";

import { loginB2B, logoutB2B } from "@/actions/b2b-login";
import toast from "react-hot-toast";
import ProductSearchAutocomplete from "@/components/ProductSearchAutocomplete";

export default function PublicNavbar({ b2bUser, expertUser }: { b2bUser?: any, expertUser?: any }) {
  const { totalItems, totalPrice, openCart } = useCart();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showB2BModal, setShowB2BModal] = useState(false);
  const [clientCode, setClientCode] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#b2b-login') {
        setShowB2BModal(true);
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    };
    
    // Check on mount
    handleHashChange();
    
    // Listen for changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
    <header className="public-navbar-header" style={{ position: "sticky", top: 0, zIndex: 50, background: "white", boxShadow: "var(--shadow-sm)" }}>
      {/* Top Bar for B2B/Contact (Desktop) */}
      <div className="navbar-top">
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
              <Link href="/aliados" style={{ color: "white", textDecoration: "none" }}>Portal Aliados Expertos</Link>
            </>
          )}
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Phone size={14} />
          <span>Celular / WhatsApp: 313 223 9174</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="navbar-main">
        {/* Mobile Header Row */}
        <div className="navbar-header-mobile">
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="logo-electric"
              style={{ height: "40px", width: "40px", objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className="navbar-logo-text" style={{ fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                DISTRIELECTRICOS <span style={{ color: "var(--color-secondary)" }}>E&D</span>
              </div>
              <div className="navbar-logo-sub" style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", fontWeight: 600, letterSpacing: "1px" }}>
                IDEAS CON ENERGÍA
              </div>
            </div>
          </Link>

          {/* Mobile Right Icons (Cart & Hamburger) */}
          <div className="navbar-mobile-actions">
            <button 
              type="button"
              onClick={openCart} 
              aria-label="Abrir carrito"
              style={{ position: "relative", cursor: "pointer", color: "var(--color-primary)", background: "none", border: "none", padding: "0.4rem", display: "flex", alignItems: "center" }}
            >
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "var(--color-secondary)", color: "white", fontSize: "0.75rem", fontWeight: "bold", minWidth: "18px", height: "18px", borderRadius: "9999px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                  {totalItems}
                </span>
              )}
            </button>
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(true)} 
              aria-label="Abrir menú"
              style={{ background: "none", border: "none", color: "var(--color-primary)", padding: "0.4rem", display: "flex", alignItems: "center" }}
            >
              <Menu size={26} />
            </button>
          </div>
        </div>

        {/* Predictive Search Bar */}
        <form onSubmit={handleSearch} className="navbar-search" style={{ position: "relative", flex: 1, maxWidth: "600px" }}>
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none", zIndex: 2 }} />
          <ProductSearchAutocomplete 
            value={searchTerm}
            onChange={(val) => setSearchTerm(val)}
            onSelect={(product) => {
              setSearchTerm("");
              router.push(`/producto/${product.id}`);
            }}
            placeholder="¿Qué producto buscas para tu proyecto?" 
            showStock={!!b2bUser || !!expertUser}
            style={{ 
              width: "100%", 
              padding: "0.75rem 5.8rem 0.75rem 2.5rem", 
              borderRadius: "9999px", 
              border: "2px solid var(--color-primary)", 
              fontSize: "0.95rem", 
              outline: "none", 
              transition: "all 0.2s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          />
          <button 
            type="submit" 
            style={{ 
              position: "absolute", 
              right: "4px", 
              top: "50%", 
              transform: "translateY(-50%)", 
              background: "var(--color-secondary)", 
              color: "white", 
              padding: "0.48rem 1.1rem", 
              borderRadius: "9999px", 
              fontWeight: 700, 
              border: "none", 
              cursor: "pointer", 
              fontSize: "0.85rem",
              zIndex: 2 
            }}
          >
            Buscar
          </button>
        </form>

        {/* Desktop User Actions */}
        <div className="navbar-actions">
          <Link href="/profile" style={{ display: "flex", flexDirection: "column", alignItems: "center", color: "var(--color-primary)", gap: "0.25rem", textDecoration: "none" }}>
            <User size={22} />
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Mi Cuenta</span>
          </Link>
          <div 
            onClick={openCart}
            style={{ position: "relative", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", color: "var(--color-primary)", gap: "0.25rem" }}
          >
            <div style={{ position: "relative" }}>
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <span style={{ position: "absolute", top: "-8px", right: "-8px", background: "var(--color-secondary)", color: "white", fontSize: "0.75rem", fontWeight: "bold", width: "18px", height: "18px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {totalItems}
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>${totalPrice.toLocaleString('de-DE')}</span>
          </div>
        </div>
      </div>

      {/* Navigation Categories (Swipeable on Mobile) */}
      <nav className="categories-nav">
        <Link href="/catalog" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "var(--color-primary)", textDecoration: "none", flexShrink: 0, fontSize: "0.88rem" }}>
          <LayoutGrid size={17} />
          <span>Todos</span>
        </Link>
        <Link href="/catalog?flash=true" style={{ textDecoration: "none", fontSize: "0.88rem", fontWeight: 700, color: "var(--color-danger)", display: "inline-flex", alignItems: "center", gap: "0.25rem", flexShrink: 0, background: "#fee2e2", padding: "0.2rem 0.6rem", borderRadius: "9999px" }}>
          <Zap size={14} fill="currentColor" /> Ofertas Flash
        </Link>
        <Link href="/catalog?category=11651069-bb4d-477b-9d77-afac5495b18f" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none", flexShrink: 0, fontSize: "0.88rem" }}>Iluminación</Link>
        <Link href="/catalog?category=204a74cb-97b1-4554-9bee-4d5b71dfc000" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none", flexShrink: 0, fontSize: "0.88rem" }}>Cables Eléctricos</Link>
        <Link href="/catalog?category=18811ae2-62ea-45c5-b410-fce91ff5d585" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none", flexShrink: 0, fontSize: "0.88rem" }}>Aparamenta</Link>
        <Link href="/catalog?category=3bdc7419-5e3c-4537-a360-d774e8964ea7" style={{ fontWeight: 500, color: "var(--color-text-main)", textDecoration: "none", flexShrink: 0, fontSize: "0.88rem" }}>Tubería</Link>
      </nav>
    </header>
    
    {/* Hamburger Menu Overlay */}
    {isMobileMenuOpen && (
      <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}>
        <div className="mobile-menu-content" onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <img src="/logo.png" alt="Logo" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
              <span style={{ fontWeight: 800, color: "var(--color-primary)", fontSize: "1.1rem" }}>Menú</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", padding: "0.25rem" }}>
              <X size={24} />
            </button>
          </div>
          
          <nav style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {b2bUser ? (
              <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ fontWeight: 600, color: "var(--color-secondary)", marginBottom: "0.5rem" }}>🏢 B2B: {b2bUser.companyName}</div>
                <button onClick={handleB2BLogout} style={{ color: "var(--color-text-muted)", textDecoration: "underline", fontSize: "0.85rem" }}>Cerrar Sesión B2B</button>
              </div>
            ) : expertUser ? (
              <div style={{ paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ fontWeight: 600, color: "var(--color-secondary)", marginBottom: "0.5rem" }}>⚡ Aliado: {expertUser.name}</div>
                <Link href="/aliados/cotizador" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "block", marginBottom: "0.5rem", color: "var(--color-primary)", fontWeight: 600 }}>Ir al Cotizador</Link>
                <button onClick={handleExpertLogout} style={{ color: "var(--color-text-muted)", textDecoration: "underline", fontSize: "0.85rem" }}>Cerrar Sesión Aliado</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                <button onClick={() => { setIsMobileMenuOpen(false); setShowB2BModal(true); }} className="btn btn-outline" style={{ justifyContent: "center" }}>
                  <User size={18} /> Acceso B2B
                </button>
                <Link href="/aliados" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ justifyContent: "center" }}>Portal Aliados</Link>
              </div>
            )}

            <Link href="/catalog" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 700, color: "var(--color-primary)" }}>
              <LayoutGrid size={20} /> Todos los Departamentos
            </Link>
            <Link href="/catalog?flash=true" onClick={() => setIsMobileMenuOpen(false)} style={{ color: "var(--color-danger)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Zap size={18} /> Ofertas Flash
            </Link>
            <Link href="/catalog?category=11651069-bb4d-477b-9d77-afac5495b18f" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Iluminación</Link>
            <Link href="/catalog?category=204a74cb-97b1-4554-9bee-4d5b71dfc000" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Conductores Eléctricos</Link>
            <Link href="/catalog?category=18811ae2-62ea-45c5-b410-fce91ff5d585" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Aparamenta</Link>
            <Link href="/catalog?category=3bdc7419-5e3c-4537-a360-d774e8964ea7" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500, color: "var(--color-text-main)" }}>Tubería y Accesorios</Link>

            <Link href="/cotizar" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 600, color: "var(--color-secondary)" }}>
              <Sparkles size={18} /> Cotizar Proyecto
            </Link>

            <Link href="/estado-pedido" onClick={() => setIsMobileMenuOpen(false)} style={{ fontWeight: 500, color: "var(--color-text-muted)" }}>
              Rastrear mi pedido
            </Link>

            <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontWeight: 600, color: "var(--color-primary)", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
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
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary)", textAlign: "center" }}>Acceso B2B</h2>
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
