"use client";

import { useState, useTransition } from "react";
import { requestPasswordReset } from "@/actions/auth-reset";
import { Zap, AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    startTransition(async () => {
      const res = await requestPasswordReset(email);
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
          Recuperar Contraseña
        </h1>
        <p style={{ color: "var(--color-text-muted)", marginTop: "0.5rem", textAlign: "center", fontSize: "0.95rem" }}>
          Ingresa tu correo para recibir un enlace de recuperación
        </p>
      </div>

      <div className="card" style={{ padding: "2rem" }}>
        {isSuccess ? (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <CheckCircle2 size={48} color="var(--color-success)" />
            <h3 style={{ margin: 0 }}>¡Correo Enviado!</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem" }}>
              Si el correo <strong>{email}</strong> está registrado en nuestro sistema, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
            </p>
            <a href="/login" className="btn btn-outline" style={{ width: "100%", marginTop: "1rem", textDecoration: "none", display: "flex", justifyContent: "center" }}>
              Volver al inicio
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
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
              disabled={isPending || !email}
              className="btn btn-primary"
              style={{ 
                width: "100%", padding: "0.85rem", fontSize: "1rem", 
                marginTop: "0.5rem", boxShadow: "0 4px 6px -1px rgba(32, 53, 98, 0.2)",
                opacity: (isPending || !email) ? 0.7 : 1
              }}
            >
              {isPending ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Enviando enlace...
                </>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </button>

            <div style={{ textAlign: "center", marginTop: "0.5rem" }}>
              <a href="/login" style={{ 
                display: "inline-flex", alignItems: "center", gap: "0.5rem", 
                color: "var(--color-text-muted)", fontSize: "0.9rem", textDecoration: "none", fontWeight: 500 
              }}>
                <ArrowLeft size={16} /> Volver al Login
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
