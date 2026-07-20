"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";
import { AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function LoginCorpPage() {
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
          Acceso Corporativo
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", textAlign: "center", fontSize: "0.95rem" }}>
          Plataforma exclusiva de administración
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        <form action={dispatch} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Usuario Corporativo
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="admin@empresa.com"
              required
              className="input"
            />
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="password" className="form-label" style={{ marginBottom: 0 }}>
                Contraseña
              </label>
            </div>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              minLength={6}
              className="input"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: "100%", marginTop: "0.5rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 size={20} className="spin" />
                Iniciando sesión...
              </>
            ) : (
              "Ingresar al ERP"
            )}
          </button>

          <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
            <a href="/" style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", textDecoration: "none" }}>
              Volver a la tienda
            </a>
          </div>

          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorMessage && (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-500">{errorMessage}</p>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
