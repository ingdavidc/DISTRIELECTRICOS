"use client";

import { useState } from "react";
import { Search, Plus, Trash2, FileText, Send, Mail } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import Link from "next/link";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  brand: string | null;
  unit: string;
  stock: number;
}

export default function ExpertQuoterClient({ expertUser, products }: { expertUser: any, products: Product[] }) {
  const [clientName, setClientName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<{ product: Product, quantity: number }[]>([]);

  // Filtro de búsqueda
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 15); // limit to 15 results

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success("Agregado a la cotización");
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) return;
    setCart(prev => prev.map(item => item.product.id === id ? { ...item, quantity: qty } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.product.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  const generatePDF = () => {
    if (!clientName) {
      toast.error("Ingresa el nombre del cliente final");
      return null;
    }
    if (cart.length === 0) {
      toast.error("La cotización está vacía");
      return null;
    }

    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // primary color
    doc.text("DISTRIELECTRICOS E&D", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Ideas con Energía", 14, 26);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("COTIZACIÓN", 150, 20);

    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 26);
    doc.text(`Cotizado por: ${expertUser.name}`, 150, 32);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Cliente: ${clientName}`, 14, 40);

    // Table
    const tableData = cart.map(item => [
      item.product.sku,
      item.product.name,
      item.product.brand || "-",
      item.quantity.toString(),
      `$${item.product.price.toLocaleString('de-DE')}`,
      `$${(item.product.price * item.quantity).toLocaleString('de-DE')}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['SKU', 'Producto', 'Marca', 'Cant.', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }
    });

    // Total
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`Total: $${total.toLocaleString('de-DE')}`, 150, finalY);

    return doc;
  };

  const downloadPDF = () => {
    const doc = generatePDF();
    if (doc) {
      doc.save(`Cotizacion_${clientName.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF Descargado");
    }
  };

  const sendByWhatsApp = () => {
    if (!clientName) return toast.error("Ingresa el nombre del cliente");
    if (cart.length === 0) return toast.error("Cotización vacía");

    let message = `*Cotización - DISTRIELECTRICOS E&D*\n`;
    message += `Cliente: ${clientName}\n\n`;
    
    cart.forEach(item => {
      message += `- ${item.quantity}x ${item.product.name} | $${(item.product.price * item.quantity).toLocaleString('de-DE')}\n`;
    });

    message += `\n*Total: $${total.toLocaleString('de-DE')}*`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem", display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem", alignItems: "start" }}>
      
      {/* Left Column: Search & Add */}
      <div className="card" style={{ padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary)" }}>Buscar Productos (PVP)</h1>
          <Link href="/aliados/dashboard" style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textDecoration: "underline" }}>Volver al Panel</Link>
        </div>

        <div style={{ position: "relative", marginBottom: "2rem" }}>
          <Search size={20} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..."
            className="input"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: "3rem", fontSize: "1.1rem" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem" }}>
          {searchTerm.length > 1 && filteredProducts.map(p => (
            <div key={p.id} style={{ border: "1px solid var(--color-border)", borderRadius: "8px", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{p.sku}</div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem", lineHeight: 1.2 }}>{p.name}</div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{p.brand || "Generico"}</div>
              <div style={{ fontWeight: 700, color: "var(--color-secondary)", fontSize: "1.2rem", marginTop: "auto" }}>
                ${p.price.toLocaleString('de-DE')}
              </div>
              <button 
                onClick={() => addToCart(p)}
                className="btn btn-secondary" 
                style={{ marginTop: "0.5rem", padding: "0.5rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
              >
                <Plus size={16} /> Agregar
              </button>
            </div>
          ))}
          {searchTerm.length > 1 && filteredProducts.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", gridColumn: "1 / -1" }}>
              No se encontraron productos.
            </div>
          )}
          {searchTerm.length <= 1 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", gridColumn: "1 / -1" }}>
              Escribe al menos 2 caracteres para buscar.
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Quote Cart */}
      <div className="card" style={{ padding: "2rem", position: "sticky", top: "80px" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "1.5rem" }}>Cotización Actual</h2>
        
        <div style={{ marginBottom: "1.5rem" }}>
          <label className="label">Nombre del Cliente Final</label>
          <input 
            type="text" 
            className="input" 
            placeholder="Ej. Juan Pérez"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "400px", overflowY: "auto", paddingRight: "0.5rem", marginBottom: "1.5rem" }}>
          {cart.map(item => (
            <div key={item.product.id} style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "1rem" }}>
              <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.5rem" }}>{item.product.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input 
                    type="number" 
                    value={item.quantity}
                    onChange={e => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                    className="input"
                    style={{ width: "60px", padding: "0.25rem", textAlign: "center" }}
                    min={1}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>x ${item.product.price.toLocaleString('de-DE')}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "0.95rem" }}>${(item.product.price * item.quantity).toLocaleString('de-DE')}</strong>
                  <button onClick={() => removeFromCart(item.product.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center", fontSize: "0.9rem", padding: "2rem 0" }}>
              No hay productos agregados.
            </p>
          )}
        </div>

        <div style={{ borderTop: "2px solid var(--color-border)", paddingTop: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "1.25rem", fontWeight: 800 }}>
            <span>Total:</span>
            <span>${total.toLocaleString('de-DE')}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <button onClick={downloadPDF} className="btn btn-primary" style={{ padding: "0.75rem", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            <FileText size={18} /> Descargar PDF
          </button>
          <button onClick={sendByWhatsApp} className="btn btn-secondary" style={{ padding: "0.75rem", display: "flex", justifyContent: "center", gap: "0.5rem", background: "#25D366", borderColor: "#25D366" }}>
            <Send size={18} /> Enviar por WhatsApp
          </button>
        </div>

      </div>

    </div>
  );
}
