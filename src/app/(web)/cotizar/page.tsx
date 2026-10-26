"use client";

import { useState } from "react";
import { requestB2BAccess, verifyB2BCode } from "@/actions/b2b";
import { Building2, Phone, Mail, FileText, Send, CheckCircle2, ArrowLeft, User, FileUp, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

export default function B2BPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    nit: "",
    contactName: "",
    phone: "",
    email: "",
    rutUrl: ""
  });
  
  const [rutFile, setRutFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // OTP State
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUploadRut = async (): Promise<string | null> => {
    if (!rutFile) return null;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase no configurado");
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const fileExt = rutFile.name.split('.').pop();
    const fileName = `rut/rut-${formData.nit}-${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage.from("products").upload(fileName, rutFile);
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rutFile) {
      toast.error("Por favor adjunta tu RUT (PDF o Imagen).");
      return;
    }
    
    setIsSubmitting(true);
    const tid = toast.loading("Procesando solicitud...");
    try {
      const uploadedUrl = await handleUploadRut();
      
      const res = await requestB2BAccess({
        ...formData,
        rutUrl: uploadedUrl || ""
      });
      
      if (res.success) {
        toast.dismiss(tid);
        setRequestId(res.requestId || null);
      } else {
        toast.error(res.error || "Error", { id: tid });
      }
    } catch (error: any) {
      toast.error("Hubo un error: " + error.message, { id: tid });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestId) return;
    
    setIsVerifying(true);
    const tid = toast.loading("Verificando código...");
    try {
      const res = await verifyB2BCode(requestId, otpCode);
      if (res.success) {
        toast.success("Verificado correctamente", { id: tid });
        setIsSuccess(true);
      } else {
        toast.error(res.error || "Código incorrecto", { id: tid });
      }
    } catch (e: any) {
      toast.error("Error: " + e.message, { id: tid });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isSuccess) {
    return (
      <div style={{ background: "var(--color-background)", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(1.5rem, 4vw, 2.5rem) 1rem" }}>
        <div className="card" style={{ maxWidth: "500px", width: "100%", textAlign: "center", padding: "clamp(1.75rem, 5vw, 3rem) 1.5rem" }}>
          <CheckCircle2 size={56} color="var(--color-success)" style={{ margin: "0 auto 1.25rem auto" }} />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "0.75rem" }}>
            ¡Identidad Verificada!
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "1.75rem", lineHeight: 1.6, fontSize: "0.95rem" }}>
            Hemos recibido tus datos corporativos. Nuestro equipo revisará la información y te notificaremos vía WhatsApp cuando tu cuenta sea aprobada y se te asigne tu <strong>CÓDIGO ÚNICO</strong> para acceder a los precios especiales.
          </p>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block", padding: "0.85rem 1.75rem", borderRadius: "9999px", fontWeight: 700 }}>
            Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", padding: "clamp(1.5rem, 4vw, 3rem) 1rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "1.5rem", fontWeight: 600, fontSize: "0.9rem" }}>
          <ArrowLeft size={16} /> Volver a la Tienda
        </Link>
        
        <div className="card" style={{ padding: "clamp(1.5rem, 4vw, 3rem) clamp(1rem, 3vw, 2.5rem)" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h1 style={{ fontSize: "clamp(1.6rem, 5vw, 2.3rem)", fontWeight: 800, color: "var(--color-primary)", marginBottom: "0.75rem" }}>
              Ventas Corporativas B2B
            </h1>
            <p style={{ fontSize: "0.98rem", color: "var(--color-text-muted)", maxWidth: "600px", margin: "0 auto", lineHeight: 1.5 }}>
              Regístrate para obtener tu Código de Acceso Corporativo. Atendemos a constructoras, integradores, tableristas y clientes mayoristas con precios preferenciales.
            </p>
          </div>

          {!requestId ? (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.25rem" }}>
              <div className="form-grid">
                <div>
                  <label className="form-label">Empresa / Razón Social *</label>
                  <div style={{ position: "relative" }}>
                    <Building2 size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)", pointerEvents: "none" }} />
                    <input required type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label">NIT / Identificación *</label>
                  <div style={{ position: "relative" }}>
                    <FileText size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)", pointerEvents: "none" }} />
                    <input required type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">Nombre del Contacto *</label>
                  <div style={{ position: "relative" }}>
                    <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)", pointerEvents: "none" }} />
                    <input required type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Correo Electrónico *</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)", pointerEvents: "none" }} />
                    <input required type="email" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="form-label">Teléfono (WhatsApp) *</label>
                <div style={{ position: "relative" }}>
                  <Phone size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)", pointerEvents: "none" }} />
                  <input required type="tel" className="input" placeholder="Ej: +57 300 000 0000" style={{ paddingLeft: "2.5rem" }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.4rem" }}>
                  A este número te enviaremos el código de verificación automático.
                </p>
              </div>

              <div>
                <label className="form-label">Adjuntar RUT (PDF o Imagen) *</label>
                <div style={{ border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "1.75rem 1rem", textAlign: "center", background: "var(--color-background)", position: "relative" }}>
                  <FileUp size={30} color="var(--color-medium-gray)" style={{ margin: "0 auto 0.75rem auto" }} />
                  <p style={{ fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.35rem", fontSize: "0.9rem", wordBreak: "break-word" }}>
                    {rutFile ? rutFile.name : "Haz clic para subir o arrastra el archivo aquí"}
                  </p>
                  <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Formatos permitidos: PDF, JPG, PNG</span>
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    onChange={e => setRutFile(e.target.files?.[0] || null)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} 
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: "0.95rem", fontSize: "1.05rem", display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.75rem", borderRadius: "var(--radius-md)" }}>
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                {isSubmitting ? "Enviando..." : "Solicitar Acceso B2B"}
              </button>
            </form>
          ) : (
            // WhatsApp Verification Step
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", alignItems: "center", padding: "1rem 0" }}>
              <div style={{ width: "70px", height: "70px", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.5rem" }}>
                <KeyRound size={36} color="#166534" />
              </div>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 700, textAlign: "center", margin: 0 }}>Verifica tu WhatsApp</h2>
              <p style={{ textAlign: "center", color: "var(--color-text-muted)", maxWidth: "400px", fontSize: "0.92rem", lineHeight: 1.5 }}>
                Hemos enviado un código de 6 dígitos a <strong>{formData.phone}</strong>. Ingresa el código a continuación para validar tu solicitud.
              </p>
              
              <div style={{ position: "relative", width: "100%", maxWidth: "280px" }}>
                <input 
                  required 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  className="input" 
                  style={{ textAlign: "center", fontSize: "1.8rem", padding: "0.75rem", letterSpacing: "0.4rem", fontWeight: 800 }} 
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                />
              </div>

              <button type="submit" disabled={isVerifying || otpCode.length !== 6} className="btn btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "1.05rem", display: "flex", justifyContent: "center", gap: "0.5rem", width: "100%", maxWidth: "280px", borderRadius: "9999px" }}>
                {isVerifying ? <Loader2 className="animate-spin" size={20} /> : "Verificar Código"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
