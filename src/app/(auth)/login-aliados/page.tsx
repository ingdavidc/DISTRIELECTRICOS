"use client";

import { useActionState } from "react";
import { authenticateExpert } from "@/actions/auth";
import { AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import Link from "next/link";

export default function LoginAliadosPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticateExpert,
    undefined
  );

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  return (
    <div style={{ width: "100%", maxWidth: "450px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ 
          marginBottom: "1rem",
          display: "flex", justifyContent: "center"
        }}>
          <img src="/logo.png" alt="DistriEléctricos" style={{ width: "auto", height: "70px", objectFit: "contain" }} />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-secondary)", margin: 0, textAlign: "center" }}>
          Portal Aliados Expertos
        </h1>
        
        <div style={{
          backgroundColor: "#fff7ed", // orange-50
          border: "1px solid #fed7aa", // orange-200
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          marginTop: "1.5rem",
          textAlign: "center"
        }}>
          <p style={{ color: "#ea580c", margin: 0, fontSize: "0.95rem", lineHeight: 1.5 }}>
            <strong>¡Hola! Es un honor tenerte de vuelta.</strong><br/>
            Gracias por confiar en DistriEléctricos como tu principal aliado comercial. Esta herramienta es <strong>100% gratuita</strong> y ha sido diseñada exclusivamente para facilitar tu trabajo y ayudarte a crecer.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: "2rem", borderTop: "4px solid var(--color-secondary)" }}>
        <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label" style={{ color: "var(--color-text)" }}>
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="tu@correo.com"
              required
              className="input"
              style={{ borderColor: "#fed7aa" }}
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password" className="form-label" style={{ marginBottom: 0, color: "var(--color-text)" }}>
                Contraseña
              </label>
              <Link href="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--color-secondary)", textDecoration: "none", fontWeight: 600 }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="input"
              style={{ borderColor: "#fed7aa" }}
            />
          </div>

          {errorMessage && (
            <div style={{ 
              display: "flex", alignItems: "center", gap: "0.5rem", 
              color: "var(--color-danger)", backgroundColor: "#fef2f2", 
              padding: "0.75rem", borderRadius: "var(--radius-md)", 
              fontSize: "0.85rem", border: "1px solid #fecaca" 
            }}>
              <AlertCircle size={16} />
              <p style={{ margin: 0 }}>{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="btn"
            style={{ 
              width: "100%", padding: "0.85rem", fontSize: "1rem", 
              marginTop: "0.5rem", boxShadow: "0 4px 6px -1px rgba(243, 112, 33, 0.2)",
              backgroundColor: "var(--color-secondary)",
              color: "white",
              fontWeight: 600,
              opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar a mi Portal"
            )}
          </button>

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <Link href="/aliados" style={{ 
              display: "inline-flex", alignItems: "center", gap: "0.5rem", 
              color: "var(--color-text-muted)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500 
            }}>
              <ArrowLeft size={16} /> Volver a información
            </Link>
          </div>
        </form>
      </div>
      
      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        &copy; {new Date().getFullYear()} DistriEléctricos E&D.
      </div>
    </div>
  );
}
