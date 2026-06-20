"use client";

import { useState, useEffect } from "react";
import { Building2, Search, Plus, Edit2, Trash2, Mail, Phone, CheckCircle, XCircle, FileText, CreditCard, Landmark, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/actions/suppliers";

type Supplier = Awaited<ReturnType<typeof getSuppliers>>[0];

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("fiscal"); // fiscal, contact, financial, accounting

  const [formData, setFormData] = useState({
    name: "",
    nit: "",
    taxRegime: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    category: "",
    paymentTerms: "CONTADO",
    status: "ACTIVE",
    bankDetails: "",
    paymentMethod: "",
    creditLimit: "",
    cxpAccount: "",
    expenseAccount: "",
    retentionCodes: ""
  });

  const loadSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      toast.error("Error al cargar proveedores");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const handleOpenModal = (supplier?: Supplier) => {
    setActiveTab("fiscal");
    if (supplier) {
      setEditingId(supplier.id);
      setFormData({
        name: supplier.name,
        nit: supplier.nit || "",
        taxRegime: supplier.taxRegime || "",
        contactName: supplier.contactName || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        category: supplier.category || "",
        paymentTerms: supplier.paymentTerms || "CONTADO",
        status: supplier.status || "ACTIVE",
        bankDetails: supplier.bankDetails || "",
        paymentMethod: supplier.paymentMethod || "",
        creditLimit: supplier.creditLimit ? supplier.creditLimit.toString() : "",
        cxpAccount: supplier.cxpAccount || "",
        expenseAccount: supplier.expenseAccount || "",
        retentionCodes: supplier.retentionCodes || ""
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        nit: "",
        taxRegime: "",
        contactName: "",
        email: "",
        phone: "",
        address: "",
        category: "",
        paymentTerms: "CONTADO",
        status: "ACTIVE",
        bankDetails: "",
        paymentMethod: "",
        creditLimit: "",
        cxpAccount: "",
        expenseAccount: "",
        retentionCodes: ""
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
    if (!formData.name) {
      toast.error("La Razón Social es obligatoria");
      setActiveTab("fiscal");
      return;
    }

    const tid = toast.loading("Guardando proveedor...");
    try {
      if (editingId) {
        const res = await updateSupplier(editingId, formData);
        if (res.success) {
          toast.success("Proveedor actualizado", { id: tid });
          loadSuppliers();
          handleCloseModal();
        } else {
          toast.error(res.error || "Error al actualizar", { id: tid });
        }
      } else {
        const res = await createSupplier(formData);
        if (res.success) {
          toast.success("Proveedor creado", { id: tid });
          loadSuppliers();
          handleCloseModal();
        } else {
          toast.error(res.error || "Error al crear", { id: tid });
        }
      }
    } catch (err) {
      toast.error("Ocurrió un error inesperado", { id: tid });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este proveedor?")) return;
    
    const tid = toast.loading("Eliminando proveedor...");
    const res = await deleteSupplier(id);
    
    if (res.success) {
      toast.success("Proveedor eliminado", { id: tid });
      loadSuppliers();
    } else {
      toast.error(res.error || "Error al eliminar", { id: tid });
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.nit && s.nit.includes(searchTerm)) ||
    (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Directorio de Proveedores</h1>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="toolbar" style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, NIT o asesor..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="card">
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>
            <div className="animate-spin" style={{ display: "inline-block", marginBottom: "1rem" }}><Building2 size={32} /></div>
            <p>Cargando directorio de proveedores...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--color-text-muted)" }}>No se encontraron proveedores.</div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Contacto</th>
                  <th>Financiera / Pagos</th>
                  <th>Cuentas (CXP/Gasto)</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "8px", background: "var(--color-light-gray)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{supplier.name}</div>
                          <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>NIT: {supplier.nit || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ fontWeight: 500 }}>{supplier.contactName || 'Sin asignar'}</div>
                        {supplier.email && <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><Mail size={12}/> {supplier.email}</div>}
                        {supplier.phone && <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}><Phone size={12}/> {supplier.phone}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
                        <div><span style={{color: "var(--color-text-muted)"}}>Método:</span> {supplier.paymentMethod || 'N/A'}</div>
                        <div><span style={{color: "var(--color-text-muted)"}}>Plazo:</span> {supplier.paymentTerms}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
                        <div><span style={{color: "var(--color-text-muted)"}}>CXP:</span> {supplier.cxpAccount || 'N/A'}</div>
                        <div><span style={{color: "var(--color-text-muted)"}}>Gasto:</span> {supplier.expenseAccount || 'N/A'}</div>
                      </div>
                    </td>
                    <td>
                      {supplier.status === 'ACTIVE' ? (
                        <span className="badge badge-success" style={{ display: "flex", alignItems: "center", gap: "4px", width: "fit-content" }}><CheckCircle size={14}/> Activo</span>
                      ) : (
                        <span className="badge badge-danger" style={{ display: "flex", alignItems: "center", gap: "4px", width: "fit-content" }}><XCircle size={14}/> Inactivo</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button className="btn btn-outline" style={{ padding: "0.5rem" }} onClick={() => handleOpenModal(supplier)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-outline" style={{ padding: "0.5rem", color: "var(--color-danger)", borderColor: "var(--color-danger)" }} onClick={() => handleDelete(supplier.id)} title="Eliminar">
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

      {/* Modal Multi-Pestaña Premium */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px", padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", height: "90vh" }}>
            
            <div className="modal-header" style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", background: "var(--color-background)" }}>
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 size={24} color="var(--color-primary)" />
                {editingId ? 'Ficha del Proveedor' : 'Alta de Nuevo Proveedor'}
              </h2>
              <button className="btn-close" onClick={handleCloseModal}>×</button>
            </div>

            {/* TABS HEADER */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", background: "white", padding: "0 1.5rem" }}>
              {[
                { id: "fiscal", label: "Fiscal y Legal", icon: FileText },
                { id: "contact", label: "Contacto", icon: Phone },
                { id: "financial", label: "Finanzas y Pagos", icon: CreditCard },
                { id: "accounting", label: "Contabilidad", icon: BookOpen },
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      flex: 1,
                      padding: "1rem",
                      background: "none",
                      border: "none",
                      borderBottom: isActive ? "2px solid var(--color-primary)" : "2px solid transparent",
                      color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                      fontWeight: isActive ? 600 : 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              
              <div className="modal-body" style={{ flex: 1, overflowY: "auto", padding: "2rem", background: "white" }}>
                
                {/* TAB 1: FISCAL Y LEGAL */}
                {activeTab === "fiscal" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}>Identificación Fiscal</h3>
                    <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Razón Social Legal *</label>
                        <input type="text" className="form-input" placeholder="Nombre completo de la empresa" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Identificación Fiscal (NIT/RUT/RFC)</label>
                        <input type="text" className="form-input" placeholder="Ej: 900.123.456-7" value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Régimen Tributario</label>
                        <select className="form-input" value={formData.taxRegime} onChange={e => setFormData({...formData, taxRegime: e.target.value})}>
                          <option value="">Seleccione un régimen...</option>
                          <option value="RESPONSABLE_IVA">Responsable de IVA</option>
                          <option value="NO_RESPONSABLE_IVA">No Responsable de IVA</option>
                          <option value="GRAN_CONTRIBUYENTE">Gran Contribuyente</option>
                          <option value="REGIMEN_SIMPLE">Régimen Simple de Tributación</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Dirección Fiscal Oficial</label>
                        <input type="text" className="form-input" placeholder="Calle, número, ciudad, departamento" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Categoría / Tipo de Proveedor</label>
                        <input type="text" className="form-input" placeholder="Ej: Materiales Eléctricos, Papelería, Servicios" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: CONTACTO COMERCIAL */}
                {activeTab === "contact" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}>Contacto para Compras</h3>
                    <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Nombre del Asesor / Ejecutivo de Cuenta</label>
                        <input type="text" className="form-input" placeholder="Persona a quien se le envían las órdenes" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Correo Electrónico (Para envío de POs)</label>
                        <input type="email" className="form-input" placeholder="ventas@proveedor.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Teléfono / Celular</label>
                        <input type="text" className="form-input" placeholder="+57 300 000 0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: FINANCIERA Y PAGOS */}
                {activeTab === "financial" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}>Acuerdos de Pago e Información Bancaria</h3>
                    <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div className="form-group">
                        <label className="form-label">Método de Pago Preferido</label>
                        <select className="form-input" value={formData.paymentMethod} onChange={e => setFormData({...formData, paymentMethod: e.target.value})}>
                          <option value="">Seleccione...</option>
                          <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                          <option value="CHEQUE">Cheque</option>
                          <option value="EFECTIVO">Efectivo</option>
                          <option value="TARJETA_CREDITO">Tarjeta de Crédito Corporativa</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Plazo de Crédito Acordado</label>
                        <select className="form-input" value={formData.paymentTerms} onChange={e => setFormData({...formData, paymentTerms: e.target.value})}>
                          <option value="CONTADO">Pago de Contado (0 Días)</option>
                          <option value="CREDITO 8 DIAS">Crédito a 8 Días</option>
                          <option value="CREDITO 15 DIAS">Crédito a 15 Días</option>
                          <option value="CREDITO 30 DIAS">Crédito a 30 Días</option>
                          <option value="CREDITO 60 DIAS">Crédito a 60 Días</option>
                          <option value="CREDITO 90 DIAS">Crédito a 90 Días</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Datos Bancarios para Transferencias</label>
                        <textarea className="form-input" placeholder="Ej: Bancolombia, Cuenta Corriente No. 123456789 a nombre de Empresa S.A.S" rows={3} value={formData.bankDetails} onChange={e => setFormData({...formData, bankDetails: e.target.value})}></textarea>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Límite de Crédito Permitido ($)</label>
                        <input type="number" className="form-input" placeholder="Ej: 50000000" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: CONFIGURACIÓN CONTABLE */}
                {activeTab === "accounting" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <h3 style={{ fontSize: "1.1rem", color: "var(--color-primary)", marginBottom: "0.5rem" }}>Automatización de PUC (Plan Único de Cuentas)</h3>
                    <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                      <div className="form-group">
                        <label className="form-label">Cuenta por Pagar (CXP - Pasivo)</label>
                        <input type="text" className="form-input" placeholder="Ej: 220501 - Proveedores Nacionales" value={formData.cxpAccount} onChange={e => setFormData({...formData, cxpAccount: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Cuenta de Gasto/Costo Predeterminada</label>
                        <input type="text" className="form-input" placeholder="Ej: 613501 - Compra de Mercancía" value={formData.expenseAccount} onChange={e => setFormData({...formData, expenseAccount: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                        <label className="form-label">Códigos de Retención Aplicables (ReteFuente/ReteICA)</label>
                        <input type="text" className="form-input" placeholder="Ej: RET_COMPRA_2.5, ICA_9.66" value={formData.retentionCodes} onChange={e => setFormData({...formData, retentionCodes: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
                        <label className="form-label">Estado del Proveedor en el ERP</label>
                        <select className="form-input" style={{ width: "fit-content" }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                          <option value="ACTIVE">ACTIVO - Habilitado para operar</option>
                          <option value="INACTIVE">INACTIVO - Bloqueado para compras</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              <div className="modal-footer" style={{ padding: "1.5rem", borderTop: "1px solid var(--color-border)", background: "var(--color-background)", display: "flex", justifyContent: "space-between" }}>
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem" }}>
                  <CheckCircle size={20} />
                  {editingId ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </>
  );
}
