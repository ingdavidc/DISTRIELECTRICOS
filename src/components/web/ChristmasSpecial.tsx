"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, X, Gift } from "lucide-react";

/**
 * =========================================================================
 * 🎄 CONFIGURACIÓN DE TEMPORADA NAVIDEÑA
 * =========================================================================
 * Para activar o desactivar todo el modo navideño (nieve, gorrito, banner,
 * guirnalda de luces y badges):
 * Cambia CHRISTMAS_ACTIVE a true o false.
 * Todo vuelve a su estado normal instantáneamente sin alterar nada más.
 */
export const CHRISTMAS_ACTIVE = true;

/**
 * Efecto de nieve sutil que cae en toda la página
 * Implementado con Canvas HTML5 ligero y de alto rendimiento.
 * - pointer-events: none (no bloquea clics, scroll ni toques en ningún elemento).
 * - Pausa automática si la pestaña se minimiza o pasa a segundo plano.
 * - Adaptable a dispositivos móviles (menos copos para máxima fluidez).
 */
export function SnowfallEffect() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!CHRISTMAS_ACTIVE) return;

    // Respetar preferencias de reducción de movimiento por accesibilidad
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const isMobile = width < 768;
    const flakeCount = isMobile ? 22 : 45; // Cantidad sutil y elegante

    interface Flake {
      x: number;
      y: number;
      radius: number;
      density: number;
      speedY: number;
      speedX: number;
      opacity: number;
      swing: number;
      swingSpeed: number;
    }

    const flakes: Flake[] = [];
    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1.2, // Copos pequeños de 1.2px a 3.2px
        density: Math.random() * flakeCount,
        speedY: Math.random() * 0.8 + 0.5, // Caída suave y constante
        speedX: Math.random() * 0.4 - 0.2,
        opacity: Math.random() * 0.5 + 0.35, // Transparencia suave (35% a 85%)
        swing: Math.random() * Math.PI * 2,
        swingSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    let isRunning = true;
    const handleVisibilityChange = () => {
      isRunning = !document.hidden;
      if (isRunning) {
        render();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const render = () => {
      if (!isRunning) return;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = `rgba(255, 255, 255, ${f.opacity})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(255, 255, 255, 0.6)";
        ctx.fill();

        // Movimiento de oscilación y caída
        f.swing += f.swingSpeed;
        f.x += Math.sin(f.swing) * 0.5 + f.speedX;
        f.y += f.speedY;

        // Reinicio al salir de la pantalla
        if (f.y > height + 5) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        if (f.x > width + 5) {
          f.x = -5;
        } else if (f.x < -5) {
          f.x = width + 5;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  if (!CHRISTMAS_ACTIVE) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9998,
      }}
    />
  );
}

/**
 * Guirnalda sutil de bombillos navideños con suave resplandor (Ideal para empresa de iluminación)
 */
function ChristmasFairyLights() {
  const colors = ["#ef4444", "#f59e0b", "#10b981", "#38bdf8", "#ec4899", "#fbbf24"];
  const bulbs = Array.from({ length: 18 });

  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        position: "absolute",
        bottom: "-3px",
        left: 0,
        right: 0,
        pointerEvents: "none",
        padding: "0 10px",
        overflow: "hidden",
      }}
    >
      {bulbs.map((_, i) => {
        const color = colors[i % colors.length];
        const delay = (i * 0.25).toFixed(2);
        return (
          <span
            key={i}
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: color,
              boxShadow: `0 0 8px ${color}, 0 0 12px ${color}`,
              animation: `fairyBlink 1.8s ease-in-out infinite alternate ${delay}s`,
              display: "inline-block",
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Barra superior de anuncio navideño
 */
export function ChristmasBanner() {
  const [visible, setVisible] = useState(true);

  if (!CHRISTMAS_ACTIVE || !visible) return null;

  return (
    <aside
      aria-label="Promoción especial navideña"
      style={{
        background: "linear-gradient(90deg, #0b1f17 0%, #172744 50%, #4a131b 100%)",
        color: "white",
        borderBottom: "1px solid rgba(243, 148, 35, 0.4)",
        padding: "0.55rem 1.25rem",
        fontSize: "0.85rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      <ChristmasFairyLights />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          flexWrap: "wrap",
          justifyContent: "center",
          textAlign: "center",
          paddingRight: "1.75rem",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>🎄</span>
        <span style={{ fontWeight: 600 }}>
          <strong style={{ color: "#fbbf24" }}>Temporada Navideña:</strong> ¡Ilumina tus proyectos y celebra con las mejores ofertas!
        </span>
        <Link
          href="/catalog?flash=true"
          style={{
            color: "white",
            background: "rgba(243, 148, 35, 0.25)",
            border: "1px solid #f39423",
            padding: "0.22rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.78rem",
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          <Gift size={13} color="#fbbf24" />
          Ver Ofertas Navideñas <ArrowRight size={12} />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Cerrar aviso navideño"
        style={{
          position: "absolute",
          right: "0.6rem",
          top: "50%",
          transform: "translateY(-50%)",
          color: "rgba(255,255,255,0.7)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.25rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <X size={15} />
      </button>

      <style>{`
        @keyframes fairyBlink {
          0% { opacity: 0.35; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </aside>
  );
}

/**
 * Insignia elegante de temporada navideña para el Hero
 */
export function ChristmasHeroBadge() {
  if (!CHRISTMAS_ACTIVE) return null;

  return (
    <>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.55rem",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(243, 148, 35, 0.18) 100%)",
          border: "1px solid rgba(251, 191, 36, 0.55)",
          padding: "0.4rem 0.95rem",
          borderRadius: "9999px",
          fontSize: "0.82rem",
          fontWeight: 700,
          color: "#fef08a",
          marginBottom: "1rem",
          animation: "christmasGlow 3.5s ease-in-out infinite",
          backdropFilter: "blur(4px)",
        }}
      >
        <span style={{ fontSize: "1rem" }}>🎄</span>
        <span style={{ color: "white" }}>
          Especial Navideño • <strong style={{ color: "var(--color-secondary)" }}>Ilumina la magia de tus proyectos</strong>
        </span>
        <Sparkles size={14} color="#fbbf24" />
      </div>
      <style>{`
        @keyframes christmasGlow {
          0%, 100% { box-shadow: 0 0 12px rgba(243, 148, 35, 0.25); }
          50% { box-shadow: 0 0 24px rgba(16, 185, 129, 0.4), 0 0 12px rgba(251, 191, 36, 0.35); }
        }
      `}</style>
    </>
  );
}

/**
 * Decoración sutil de estrellas / destellos en la esquina del Hero
 */
export function ChristmasCornerDecoration() {
  if (!CHRISTMAS_ACTIVE) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "160px",
        height: "160px",
        pointerEvents: "none",
        opacity: 0.22,
        zIndex: 5,
      }}
    >
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Estrella de Belén brillante */}
        <path
          d="M100 20 L103 35 L118 38 L103 41 L100 56 L97 41 L82 38 L97 35 Z"
          fill="#fbbf24"
        />
        {/* Destellos secundarios */}
        <path
          d="M65 15 L66.5 22 L74 23.5 L66.5 25 L65 32 L63.5 25 L56 23.5 L63.5 22 Z"
          fill="#fef08a"
          opacity="0.8"
        />
        <path
          d="M95 80 L96 85 L101 86 L96 87 L95 92 L94 87 L89 86 L94 85 Z"
          fill="#38bdf8"
          opacity="0.75"
        />
        {/* Esfera decorativa estilizada colgante */}
        <line x1="40" y1="0" x2="40" y2="40" stroke="#f39423" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="40" cy="46" r="6" fill="#ef4444" opacity="0.85" />
        <circle cx="38" cy="44" r="1.5" fill="white" opacity="0.9" />

        <line x1="20" y1="0" x2="20" y2="25" stroke="#f39423" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="20" cy="29" r="4" fill="#fbbf24" opacity="0.85" />
      </svg>
    </div>
  );
}

/**
 * Gorrito navideño delicado para colocar sobre el logo de la empresa
 */
export function ChristmasSantaHat() {
  if (!CHRISTMAS_ACTIVE) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "-8px",
        left: "-7px",
        width: "24px",
        height: "22px",
        pointerEvents: "none",
        transform: "rotate(-14deg)",
        zIndex: 5,
        filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))",
      }}
    >
      <svg viewBox="0 0 32 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Cono rojo del gorro */}
        <path
          d="M6 22 C9 15 17 8 28 10 C24 14 22 20 22 22 Z"
          fill="#dc2626"
        />
        {/* Borde inferior de felpa blanca */}
        <rect
          x="4"
          y="20"
          width="20"
          height="5.5"
          rx="2.5"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
        {/* Pompón blanco en la punta */}
        <circle
          cx="28"
          cy="10"
          r="3.5"
          fill="#f8fafc"
          stroke="#e2e8f0"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}
