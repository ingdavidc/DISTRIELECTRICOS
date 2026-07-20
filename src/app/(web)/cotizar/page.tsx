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
      // 1. Subir RUT
      const uploadedUrl = await handleUploadRut();
      
      // 2. Crear solicitud
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
      <div style={{ background: "var(--color-background)", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: "500px", textAlign: "center", padding: "3rem 2rem" }}>
          <CheckCircle2 size={64} color="var(--color-success)" style={{ margin: "0 auto 1.5rem auto" }} />
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "1rem" }}>
            ¡Identidad Verificada y Solicitud Enviada!
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Hemos recibido tus datos corporativos. Nuestro equipo revisará la información y te notificaremos vía WhatsApp cuando tu cuenta sea aprobada y se te asigne tu <strong>CÓDIGO ÚNICO</strong> para acceder a los precios especiales.
          </p>
          <Link href="/" className="btn btn-primary" style={{ textDecoration: "none", display: "inline-block", padding: "1rem" }}>
            Volver a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh", padding: "3rem 2rem" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-muted)", textDecoration: "none", marginBottom: "2rem", fontWeight: 500 }}>
          <ArrowLeft size={18} /> Volver a la Tienda
        </Link>
        
        <div className="card" style={{ padding: "3rem 2rem" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "1rem" }}>
              Ventas Corporativas B2B
            </h1>
            <p style={{ fontSize: "1.1rem", color: "var(--color-text-muted)", maxWidth: "600px", margin: "0 auto" }}>
              Regístrate para obtener tu Código de Acceso Corporativo. Atendemos a constructoras, integradores, tableristas y clientes mayoristas con precios preferenciales.
            </p>
          </div>

          {!requestId ? (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="md:grid-cols-2 grid-cols-1">
                <div>
                  <label className="label">Empresa / Razón Social *</label>
                  <div style={{ position: "relative" }}>
                    <Building2 size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                    <input required type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="label">NIT / Identificación *</label>
                  <div style={{ position: "relative" }}>
                    <FileText size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                    <input required type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} />
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="md:grid-cols-2 grid-cols-1">
                <div>
                  <label className="label">Nombre del Contacto *</label>
                  <div style={{ position: "relative" }}>
                    <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                    <input required type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="label">Correo Electrónico *</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                    <input required type="email" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="label">Teléfono (WhatsApp) *</label>
                <div style={{ position: "relative" }}>
                  <Phone size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                  <input required type="tel" className="input" placeholder="Ej: +57 300 000 0000" style={{ paddingLeft: "2.5rem" }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.5rem" }}>
                  A este número te enviaremos el código de verificación automático.
                </p>
              </div>

              <div>
                <label className="label">Adjuntar RUT (PDF o Imagen) *</label>
                <div style={{ border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)", padding: "2rem", textAlign: "center", background: "var(--color-background)", position: "relative" }}>
                  <FileUp size={32} color="var(--color-medium-gray)" style={{ margin: "0 auto 1rem auto" }} />
                  <p style={{ fontWeight: 600, color: "var(--color-text-main)", marginBottom: "0.5rem" }}>
                    {rutFile ? rutFile.name : "Haz clic para subir o arrastra el archivo aquí"}
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,image/*" 
                    onChange={e => setRutFile(e.target.files?.[0] || null)}
                    style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }} 
                  />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: "1.2rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                {isSubmitting ? "Enviando..." : "Solicitar Acceso B2B"}
              </button>
            </form>
          ) : (
            // WhatsApp Verification Step
            <form onSubmit={handleVerify} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", alignItems: "center", padding: "2rem 0" }}>
              <div style={{ width: "80px", height: "80px", background: "#dcfce7", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                <KeyRound size={40} color="#166534" />
              </div>
              <h2 style={{ fontSize: "1.8rem", fontWeight: 700, textAlign: "center" }}>Verifica tu WhatsApp</h2>
              <p style={{ textAlign: "center", color: "var(--color-text-muted)", maxWidth: "400px" }}>
                Hemos enviado un código de 6 dígitos a <strong>{formData.phone}</strong>. Ingresa el código a continuación para validar tu solicitud.
              </p>
              
              <div style={{ position: "relative", width: "100%", maxWidth: "300px" }}>
                <input 
                  required 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  className="input" 
                  style={{ textAlign: "center", fontSize: "2rem", padding: "1rem", letterSpacing: "0.5rem", fontWeight: 700 }} 
                  value={otpCode} 
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                />
              </div>

              <button type="submit" disabled={isVerifying || otpCode.length !== 6} className="btn btn-primary" style={{ padding: "1rem 3rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", width: "100%", maxWidth: "300px" }}>
                {isVerifying ? <Loader2 className="animate-spin" size={20} /> : "Verificar Código"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
