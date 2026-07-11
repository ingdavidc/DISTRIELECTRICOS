"use client";

import { useState, useTransition } from "react";
import { resetPassword } from "@/actions/auth-reset";
import { Zap, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
        <AlertCircle size={48} color="var(--color-danger)" style={{ margin: "0 auto 1rem auto" }} />
        <h3 style={{ margin: 0 }}>Enlace inválido</h3>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
          El enlace de recuperación es inválido o está incompleto.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    
    startTransition(async () => {
      const res = await resetPassword(token, password);
      if (res.success) {
        setIsSuccess(true);
      } else {
        setError(res.error || "Error al procesar la solicitud.");
        toast.error(res.error || "Error al procesar la solicitud.");
      }
    });
  };

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
          Nueva Contraseña
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", textAlign: "center", fontSize: "0.95rem" }}>
          Ingresa tu nueva contraseña segura
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        {isSuccess ? (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <CheckCircle2 size={48} color="var(--color-success)" />
            <h3 style={{ margin: 0 }}>¡Contraseña Actualizada!</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              Tu contraseña ha sido restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva clave.
            </p>
            <a href="/login" className="btn btn-primary" style={{ width: "100%", marginTop: "1rem", textDecoration: "none", display: "flex", justifyContent: "center" }}>
              Ir a Iniciar Sesión
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Nueva Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input"
              />
            </div>

            {error && (
              <div style={{ 
                display: "flex", alignItems: "center", gap: "0.5rem", 
                color: "var(--color-danger)", backgroundColor: "#fef2f2", 
                padding: "0.75rem", borderRadius: "var(--radius-md)", 
                fontSize: "0.85rem", border: "1px solid #fecaca" 
              }}>
                <AlertCircle size={16} />
                <p style={{ margin: 0 }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !password || !confirmPassword}
              className="btn btn-primary"
              style={{ 
                width: "100%", padding: "0.85rem", fontSize: "1rem", 
                marginTop: "0.5rem", boxShadow: "0 4px 6px -1px rgba(32, 53, 98, 0.2)",
                opacity: (isPending || !password || !confirmPassword) ? 0.7 : 1
              }}
            >
              {isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Contraseña"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
