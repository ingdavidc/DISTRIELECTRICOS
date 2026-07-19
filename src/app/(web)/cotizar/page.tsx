"use client";

import { useState } from "react";
import { submitQuoteRequest } from "@/actions/quotes";
import { Building2, Phone, Mail, FileText, Send, CheckCircle2, ArrowLeft, User } from "lucide-react";
import Link from "next/link";

export default function CotizarPage() {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitQuoteRequest(formData);
      setIsSuccess(true);
    } catch (error: any) {
      alert("Hubo un error al enviar la solicitud: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    const waText = encodeURIComponent(`Hola, acabo de enviar una solicitud de cotización B2B desde la web. Mi nombre es ${formData.name} de la empresa ${formData.company || 'Independiente'}.`);
    const waLink = `https://wa.me/573000000000?text=${waText}`; // Replace with actual company number

    return (
      <div style={{ background: "var(--color-background)", minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div className="card" style={{ maxWidth: "500px", textAlign: "center", padding: "3rem 2rem" }}>
          <CheckCircle2 size={64} color="var(--color-success)" style={{ margin: "0 auto 1.5rem auto" }} />
          <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "1rem" }}>
            ¡Solicitud Enviada!
          </h1>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "2rem", lineHeight: 1.6 }}>
            Hemos recibido los detalles de tu proyecto. Nuestro equipo de Ventas Corporativas B2B lo revisará y se pondrá en contacto contigo muy pronto.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <a href={waLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ textDecoration: "none", display: "inline-block", padding: "1rem" }}>
              Notificar por WhatsApp ahora
            </a>
            <Link href="/" className="btn btn-outline" style={{ textDecoration: "none", display: "inline-block", padding: "1rem" }}>
              Volver a la Tienda
            </Link>
          </div>
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
              Cuéntanos sobre tu proyecto. Atendemos a constructoras, integradores, tableristas y clientes mayoristas con precios preferenciales.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="md:grid-cols-2 grid-cols-1">
              <div>
                <label className="label">Nombre Completo *</label>
                <div style={{ position: "relative" }}>
                  <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                  <input required type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Empresa / Razón Social</label>
                <div style={{ position: "relative" }}>
                  <Building2 size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                  <input type="text" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }} className="md:grid-cols-2 grid-cols-1">
              <div>
                <label className="label">Teléfono / Celular *</label>
                <div style={{ position: "relative" }}>
                  <Phone size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                  <input required type="tel" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="label">Correo Electrónico</label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-medium-gray)" }} />
                  <input type="email" className="input" style={{ paddingLeft: "2.5rem" }} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Lista de Materiales o Descripción del Proyecto *</label>
              <div style={{ position: "relative" }}>
                <FileText size={18} style={{ position: "absolute", left: "1rem", top: "1.2rem", color: "var(--color-medium-gray)" }} />
                <textarea required className="input" rows={6} style={{ paddingLeft: "2.5rem", paddingTop: "1rem" }} placeholder="Ej: Necesito 200m de cable THHN calibre 12, 50 paneles LED 60x60..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ padding: "1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
              <Send size={20} />
              {isSubmitting ? "Enviando..." : "Enviar Solicitud de Cotización"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
