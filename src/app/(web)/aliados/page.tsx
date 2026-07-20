"use client";

import { useState } from "react";
import { requestExpertAccess, verifyExpertCode, loginExpert } from "@/actions/expert";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function AliadosPage() {
  const router = useRouter();

  // Form states (Register)
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  // OTP Verification
  const [showOtp, setShowOtp] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    const tid = toast.loading("Procesando solicitud...");
    try {
      const res = await requestExpertAccess({
        name,
        document,
        email,
        phone,
        passwordRaw: password
      });

      if (res.success) {
        toast.dismiss(tid);
        setRequestId(res.requestId || null);
        setShowOtp(true);
      } else {
        toast.error(res.error || "Error en el registro", { id: tid });
      }
    } catch (error: any) {
      toast.error("Error del sistema", { id: tid });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;

    setIsVerifying(true);
    const tid = toast.loading("Verificando código...");
    try {
      const res = await verifyExpertCode(requestId, otp);
      if (res.success) {
        toast.success("¡Solicitud enviada con éxito! Te notificaremos cuando el administrador te apruebe.", { id: tid, duration: 6000 });
        setShowOtp(false);
        // Clear form
        setName(""); setDocument(""); setPhone(""); setEmail(""); setPassword("");
      } else {
        toast.error(res.error || "Código incorrecto", { id: tid });
      }
    } catch (error: any) {
      toast.error("Error al verificar", { id: tid });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ minHeight: "80vh", background: "var(--color-background-alt)", display: "flex", flexDirection: "column", alignItems: "center", padding: "4rem 2rem" }}>
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)", letterSpacing: "-1px" }}>
          Portal Aliados Expertos
        </h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "1.1rem", maxWidth: "600px", margin: "1rem auto" }}>
          Un espacio diseñado para electricistas e integradores independientes. Cotiza y compra con precios preferenciales exclusivos.
        </p>
      </div>

      <div className="card" style={{ width: "100%", maxWidth: "450px", padding: "2.5rem" }}>
        
        {/* Header Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, textAlign: "center", color: "var(--color-primary)" }}>
            Solicitud de Acceso
          </h2>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button 
              onClick={() => router.push("/login-aliados")}
              style={{ padding: "0.5rem 1rem", background: "transparent", color: "var(--color-secondary)", border: "2px solid var(--color-secondary)", borderRadius: "0.5rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
            >
              Ya tengo cuenta, iniciar sesión
            </button>
          </div>
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label className="label">Nombre Completo</label>
              <input type="text" required className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Documento de Identidad</label>
              <input type="text" required className="input" value={document} onChange={e => setDocument(e.target.value)} />
            </div>
            <div>
              <label className="label">Celular (WhatsApp para verificación)</label>
              <input type="text" required className="input" placeholder="Ej: 3001234567" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="label">Correo Electrónico</label>
              <input type="email" required className="input" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">Crear Contraseña</label>
              <input type="password" required className="input" placeholder="Mínimo 6 caracteres" minLength={6} value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={isRegistering} className="btn btn-secondary" style={{ padding: "0.75rem", fontSize: "1.1rem", marginTop: "1rem" }}>
              {isRegistering ? "Procesando..." : "Solicitar Cuenta"}
            </button>
          </form>
      </div>

      {/* Modal OTP */}
      {showOtp && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", padding: "1rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "2rem", position: "relative" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-primary)", textAlign: "center" }}>Verificación de WhatsApp</h2>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", textAlign: "center", marginBottom: "1.5rem" }}>
              Hemos enviado un código de 6 dígitos a tu WhatsApp <strong>{phone}</strong>.
            </p>
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <input 
                  required
                  type="text" 
                  maxLength={6}
                  className="input" 
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "8px", fontWeight: 700 }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isVerifying || otp.length < 6} style={{ padding: "0.75rem", fontWeight: 600 }}>
                {isVerifying ? "Verificando..." : "Verificar Código"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <button onClick={() => setShowOtp(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", fontSize: "0.85rem", textDecoration: "underline", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
