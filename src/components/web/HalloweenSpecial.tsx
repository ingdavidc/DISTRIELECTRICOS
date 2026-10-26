"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X } from "lucide-react";

/**
 * =========================================================================
 * 🎃 CONFIGURACIÓN TEMPORADA DE HALLOWEEN
 * =========================================================================
 * Para desactivar todo el diseño de Halloween cuando termine la temporada:
 * Cambia HALLOWEEN_ACTIVE a false.
 * Todo volverá a su estado normal instantáneamente sin alterar nada más.
 */
export const HALLOWEEN_ACTIVE = true;

/**
 * Barra superior de anuncio de temporada de Halloween
 */
export function HalloweenBanner() {
  const [visible, setVisible] = useState(true);

  if (!HALLOWEEN_ACTIVE || !visible) return null;

  return (
    <aside
      aria-label="Promoción especial de Halloween"
      style={{
        background: "linear-gradient(90deg, #0b1120 0%, #172646 50%, #0b1120 100%)",
        color: "white",
        borderBottom: "1px solid rgba(243, 148, 35, 0.35)",
        padding: "0.5rem 1.25rem",
        fontSize: "0.85rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 40,
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", justifyContent: "center", textAlign: "center", paddingRight: "1.5rem" }}>
        <span style={{ fontSize: "1rem" }}>🎃</span>
        <span style={{ fontWeight: 600 }}>
          <strong style={{ color: "var(--color-secondary)" }}>Temporada Halloween:</strong> ¡Precios de miedo en iluminación y materiales eléctricos!
        </span>
        <Link 
          href="/catalog?flash=true" 
          style={{ 
            color: "white", 
            background: "rgba(243, 148, 35, 0.25)", 
            border: "1px solid var(--color-secondary)", 
            padding: "0.2rem 0.65rem", 
            borderRadius: "9999px", 
            fontSize: "0.78rem", 
            fontWeight: 700, 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "0.25rem",
            textDecoration: "none"
          }}
        >
          Ver Ofertas Flash <ArrowRight size={12} />
        </Link>
      </div>

      <button 
        type="button"
        onClick={() => setVisible(false)} 
        aria-label="Cerrar aviso de Halloween"
        style={{
          position: "absolute",
          right: "0.6rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.6)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.25rem",
          display: "flex",
          alignItems: "center"
        }}
      >
        <X size={15} />
      </button>
    </aside>
  );
}

/**
 * Insignia elegante de temporada para el Hero
 */
export function HalloweenHeroBadge() {
  if (!HALLOWEEN_ACTIVE) return null;

  return (
    <>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "rgba(243, 148, 35, 0.15)",
        border: "1px solid rgba(243, 148, 35, 0.4)",
        padding: "0.35rem 0.85rem",
        borderRadius: "9999px",
        fontSize: "0.82rem",
        fontWeight: 700,
        color: "var(--color-secondary)",
        marginBottom: "1rem",
        animation: "halloweenGlow 3s ease-in-out infinite"
      }}>
        <span style={{ fontSize: "0.95rem" }}>🎃</span>
        <span>Especial de Halloween • Precios que te dejarán sin aliento</span>
        <Sparkles size={14} color="var(--color-secondary)" />
      </div>
      <style>{`
        @keyframes halloweenGlow {
          0%, 100% { box-shadow: 0 0 10px rgba(243, 148, 35, 0.2); }
          50% { box-shadow: 0 0 20px rgba(243, 148, 35, 0.45); }
        }
      `}</style>
    </>
  );
}

/**
 * Decoración sutil de telaraña en la esquina del Hero (faint, no interfiere con clics)
 */
export function HalloweenCornerSpiderweb() {
  if (!HALLOWEEN_ACTIVE) return null;

  return (
    <div 
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "130px",
        height: "130px",
        pointerEvents: "none",
        opacity: 0.12,
        zIndex: 5
      }}
    >
      <svg viewBox="0 0 100 100" fill="none" stroke="white" strokeWidth="1.2">
        <path d="M0,0 Q50,0 100,0" />
        <path d="M100,0 Q100,50 100,100" />
        <path d="M0,0 L100,100" />
        <path d="M0,0 L100,60" />
        <path d="M0,0 L100,30" />
        <path d="M0,0 L60,100" />
        <path d="M0,0 L30,100" />
        <path d="M20,0 Q20,20 0,20" />
        <path d="M40,0 Q40,40 0,40" />
        <path d="M60,0 Q60,60 0,60" />
        <path d="M80,0 Q80,80 0,80" />
        <path d="M100,0 Q100,100 0,100" />
      </svg>
    </div>
  );
}
