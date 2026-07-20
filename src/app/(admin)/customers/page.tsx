"use client";

import React, { useState, useEffect, useRef } from "react";
import { Users, Search, Plus, Edit2, Trash2, Mail, Phone, ShoppingCart, Sparkles, Upload, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/actions/customers";

type Customer = Awaited<ReturnType<typeof getCustomers>>[0];

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    identification: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    personType: "",
    taxRegime: "",
    taxResponsibilities: "",
    ciiuCode: "",
    city: "",
    department: ""
  });
  
  // AI Scanner state
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      setFormData({
        identification: customer.identification,
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        personType: customer.personType || "",
        taxRegime: customer.taxRegime || "",
        taxResponsibilities: customer.taxResponsibilities || "",
        ciiuCode: customer.ciiuCode || "",
        city: customer.city || "",
        department: customer.department || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        identification: "",
        name: "",
        email: "",
        phone: "",
        address: "",
        personType: "",
        taxRegime: "",
        taxResponsibilities: "",
        ciiuCode: "",
        city: "",
        department: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.identification) {
      toast.error("La Identificación y el Nombre son obligatorios");
      return;
    }

    const tid = toast.loading("Guardando cliente...");
    try {
      if (editingId) {
        const res = await updateCustomer(editingId, formData);
        if (res.success) {
          toast.success("Cliente actualizado", { id: tid });
          loadCustomers();
          handleCloseModal();
        } else {
          toast.error(res.error || "Error al actualizar", { id: tid });
        }
      } else {
        const res = await createCustomer(formData);
        if (res.success) {
          toast.success("Cliente creado", { id: tid });
          loadCustomers();
          handleCloseModal();
        } else {
          toast.error(res.error || "Error al crear", { id: tid });
        }
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado", { id: tid });
    } finally {
      toast.dismiss(tid);
    }
  };

  const handleScanRUT = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const tid = toast.loading("Analizando RUT con Inteligencia Artificial...");

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const res = await fetch("/api/ai/parse-rut", {
        method: "POST",
        body: formDataToSend,
      });

      const json = await res.json();
      
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Error al analizar");
      }

      const data = json.data;
      setFormData(prev => ({
        ...prev,
        identification: data.identification || prev.identification,
        name: data.name || prev.name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        address: data.address || prev.address,
        personType: data.personType || prev.personType,
        taxRegime: data.taxRegime || prev.taxRegime,
        taxResponsibilities: data.taxResponsibilities || prev.taxResponsibilities,
        ciiuCode: data.ciiuCode || prev.ciiuCode,
        city: data.city || prev.city,
        department: data.department || prev.department,
      }));

      toast.success("¡Datos extraídos con éxito!", { id: tid });
    } catch (error: any) {
      toast.error(error.message, { id: tid });
    } finally {
      setIsScanning(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este cliente?")) return;
    
    const tid = toast.loading("Eliminando cliente...");
    const res = await deleteCustomer(id);
    
    if (res.success) {
      toast.success("Cliente eliminado", { id: tid });
      loadCustomers();
    } else {
      toast.error(res.error || "Error al eliminar", { id: tid });
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.identification.includes(searchTerm)
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Directorio de Clientes (CRM)</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      <div className="toolbar" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cédula, NIT o nombre..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
            <div className="animate-spin" style={{ display: "inline-block", marginBottom: "1rem" }}><Users size={32} /></div>
            <p>Cargando directorio de clientes...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>No se encontraron clientes.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Dirección</th>
                  <th>Historial POS</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer: any) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "rgba(32,53,98,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                          <Users size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{customer.name}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>ID: {customer.identification}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {customer.phone && <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}><Phone size={12}/> {customer.phone}</div>}
                        {customer.email ? (
                          <div style={{ fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "4px" }}><Mail size={12}/> {customer.email}</div>
                        ) : (
                          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Sin correo</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                        {customer.address || 'No registrada'}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: "var(--color-light-gray)", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "4px", width: "fit-content", padding: "0.3rem 0.6rem" }}>
                        <ShoppingCart size={14} />
                        {customer._count.orders} Compras
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-outline" style={{ padding: "0.5rem" }} onClick={() => handleOpenModal(customer)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: "0.5rem", color: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={() => handleDelete(customer.id)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal CRUD Cliente */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingId ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Botón Mágico IA */}
              <div style={{ padding: "1rem", backgroundColor: "#f3f4f6", borderRadius: "0.5rem", border: "1px dashed #d1d5db", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)", margin: 0 }}>
                    <Sparkles size={16} color="#eab308" /> Autocompletar con IA
                  </h4>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0, marginTop: "0.25rem" }}>
                    Sube el PDF o Imagen del RUT y la IA extraerá todos los datos.
                  </p>
                </div>
                <div>
                <input 
                  type="file" 
                  accept="application/pdf,image/*" 
                  style={{ display: "none" }} 
                  ref={fileInputRef}
                  onChange={handleScanRUT}
                  disabled={isScanning}
                />
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                  className="btn btn-primary"
                  style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem", opacity: isScanning ? 0.7 : 1 }}
                >
                  <Upload size={14} /> {isScanning ? "Analizando..." : "Subir RUT"}
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Identificación (NIT/CC) *</label>
                  <input required className="input" value={formData.identification} onChange={e => setFormData({...formData, identification: e.target.value})} />
                </div>
                <div>
                  <label className="label">Nombre / Razón Social *</label>
                  <input required className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                
                {/* Nuevos Campos DIAN */}
                <div>
                  <label className="label">Tipo de Persona</label>
                  <select className="input" value={formData.personType} onChange={e => setFormData({...formData, personType: e.target.value})}>
                    <option value="">Seleccione...</option>
                    <option value="Natural">Natural</option>
                    <option value="Juridica">Jurídica</option>
                  </select>
                </div>
                <div>
                  <label className="label">Régimen Tributario</label>
                  <input className="input" placeholder="Ej. Responsable de IVA" value={formData.taxRegime} onChange={e => setFormData({...formData, taxRegime: e.target.value})} />
                </div>
                <div>
                  <label className="label">Responsabilidades Fiscales</label>
                  <input className="input" placeholder="Ej. O-13, O-47" value={formData.taxResponsibilities} onChange={e => setFormData({...formData, taxResponsibilities: e.target.value})} />
                </div>
                <div>
                  <label className="label">Actividad Económica (CIIU)</label>
                  <input className="input" placeholder="Ej. 4659" value={formData.ciiuCode} onChange={e => setFormData({...formData, ciiuCode: e.target.value})} />
                </div>

                <div>
                  <label className="label">Correo Electrónico</label>
                  <input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div>
                  <label className="label">Teléfono</label>
                  <input type="tel" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Dirección</label>
                  <input className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div>
                  <label className="label">Ciudad</label>
                  <input className="input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                </div>
                <div>
                  <label className="label">Departamento</label>
                  <input className="input" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: "1rem", padding: "0" }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editingId ? 'Actualizar' : 'Guardar'} Cliente</button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
