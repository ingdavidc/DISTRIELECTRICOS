"use client";

import { useActionState } from "react";
import { authenticateStaff } from "@/actions/auth";
import { Zap, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function LoginStaffPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticateStaff,
    undefined
  );

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  return (
    <div style={{ width: "100%", maxWidth: "400px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ 
          width: "64px", height: "64px", 
          backgroundColor: "var(--color-primary)", 
          color: "white", 
          borderRadius: "16px", 
          display: "flex", alignItems: "center", justifyContent: "center", 
          marginBottom: "1rem",
          boxShadow: "0 10px 15px -3px rgba(32, 53, 98, 0.3)"
        }}>
          <Zap size={32} />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-primary)", margin: 0, textAlign: "center" }}>
          Acceso Operativo
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", textAlign: "center", fontSize: "0.95rem" }}>
          Ingresa tu documento de identidad para acceder al Punto de Venta o Bodega
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="form-group">
            <label htmlFor="identification" className="form-label">
              Documento de Identidad
            </label>
            <input
              id="identification"
              type="tel"
              name="identification"
              placeholder="Ej. 123456789"
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="input"
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
            className="btn btn-primary"
            style={{ 
              width: "100%", padding: "0.85rem", fontSize: "1rem", 
              marginTop: "0.5rem", boxShadow: "0 4px 6px -1px rgba(32, 53, 98, 0.2)",
              opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Ingresando...
              </>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>

          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <a href="/login" style={{ 
              display: "inline-flex", alignItems: "center", gap: "0.5rem", 
              color: "var(--color-text-muted)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500 
            }}>
              <ArrowLeft size={16} /> Acceso Administrativo
            </a>
          </div>
        </form>
      </div>
      
      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        &copy; {new Date().getFullYear()} DistriEléctricos E&D.
      </div>
    </div>
  );
}
