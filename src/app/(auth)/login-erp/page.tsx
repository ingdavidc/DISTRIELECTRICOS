"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";
import { AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
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
          marginBottom: "1.5rem",
          display: "flex", justifyContent: "center"
        }}>
          <img src="/logo.png" alt="DistriEléctricos" style={{ width: "auto", height: "80px", objectFit: "contain" }} />
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
          DistriEléctricos
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", textAlign: "center", fontSize: "0.95rem" }}>
          Ingresa tus credenciales para acceder al sistema ERP
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="correo@ejemplo.com"
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password" className="form-label" style={{ marginBottom: 0 }}>
                Contraseña
              </label>
              <a href="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}>
                ¿Olvidaste tu contraseña?
              </a>
            </div>
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
              "Ingresar al ERP"
            )}
          </button>
          
          <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <a href="/login" style={{ 
              display: "inline-flex", alignItems: "center", gap: "0.5rem", 
              color: "var(--color-text-muted)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500 
            }}>
              Acceso Operativo (POS / Bodega / Caja)
            </a>
          </div>
        </form>
      </div>
      
      <div style={{ marginTop: "2rem", textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
        &copy; {new Date().getFullYear()} DistriEléctricos E&D.<br/>Todos los derechos reservados.
      </div>
    </div>
  );
}
