"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, Search, UserCheck, X, Edit, Trash2 } from "lucide-react";
import { createUser, updateUser, deleteUser } from "@/actions/users";
import toast from "react-hot-toast";

type User = {
  id: string;
  name: string | null;
  email: string;
  identification: string | null;
  phone: string | null;
  role: string;
  modules: string[];
  createdAt: Date;
};

export default function HRClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    identification: "",
    phone: "",
    role: "CASHIER",
    password: "",
    modules: [] as string[],
  });
  
  const [initialFormData, setInitialFormData] = useState(formData);

  const filteredUsers = users.filter((u) =>
    (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (user?: User) => {
    const newFormData = { name: "", email: "", identification: "", phone: "", role: "CASHIER", password: "", modules: [] };
    if (user) {
      setEditingUser(user);
      const updated = {
        name: user.name || "",
        email: user.email,
        identification: user.identification || "",
        phone: user.phone || "",
        role: user.role,
        modules: user.modules || [],
        password: "", // Empty so it's not changed unless typed
      };
      setFormData(updated);
      setInitialFormData(updated);
    } else {
      setEditingUser(null);
      setFormData(newFormData);
      setInitialFormData(newFormData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    if (isDirty) {
      if (!confirm("Tienes cambios sin guardar. ¿Estás seguro que deseas cerrar?")) {
        return;
      }
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        document.getElementById("close-hr-modal-btn")?.click();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      let res;
      if (editingUser) {
        res = await updateUser(editingUser.id, formData);
      } else {
        if (!formData.password) {
          toast.error("La contraseña es obligatoria para nuevos usuarios.");
          return;
        }
        res = await createUser(formData);
      }

      if (res.success) {
        toast.success(editingUser ? "Usuario actualizado" : "Usuario creado");
        if (res.user) {
          if (editingUser) {
            setUsers((prev) => prev.map((u) => (u.id === res.user.id ? { ...u, ...res.user } as User : u)));
          } else {
            setUsers((prev) => [...prev, res.user as User]);
          }
        }
        handleCloseModal();
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
      startTransition(async () => {
        const res = await deleteUser(id);
        if (res.success) {
          toast.success("Usuario eliminado");
          setUsers((prev) => prev.filter((u) => u.id !== id));
        } else {
          toast.error(res.error);
        }
      });
    }
  };

  const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    CASHIER: "Cajero POS",
    WAREHOUSE: "Bodega",
    FINANCE: "Caja/Pagos",
    OPERATIVE: "Operativo",
    CUSTOMER: "Cliente",
  };

  const availableModules = [
    { id: "/pos", label: "Punto de Venta" },
    { id: "/payments", label: "Caja / Pagos" },
    { id: "/customers", label: "Clientes" },
    { id: "/inventory", label: "Inventario" },
    { id: "/dispatch", label: "Despachos" },
    { id: "/quotes", label: "Cotizaciones" },
    { id: "/purchases", label: "Órdenes de Compra" },
    { id: "/suppliers", label: "Proveedores" },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios y Roles (RRHH)</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Administra los accesos y permisos del personal.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Crear Usuario
        </button>
      </div>

      <div className="grid-cards" style={{ marginBottom: "2rem" }}>
        <div className="card" style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ background: "rgba(32, 53, 98, 0.1)", padding: "1rem", borderRadius: "var(--radius-lg)" }}>
            <UserCheck size={32} color="var(--color-primary)" />
          </div>
          <div>
            <div style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", fontWeight: 500 }}>Usuarios Activos</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main)" }}>
              {users.length}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "0" }}>
        <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input 
              type="text" 
              placeholder="Buscar usuario por nombre o email..." 
              className="input" 
              style={{ paddingLeft: "35px" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="data-table-container" style={{ border: "none", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Identificación</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Creado En</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.name || "Sin nombre"}</td>
                  <td>{user.identification || "-"}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || "-"}</td>
                  <td>
                    <span style={{ 
                      background: "var(--color-light-gray)", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: 500
                    }}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <button onClick={() => handleOpenModal(user)} style={{ color: "var(--color-secondary)" }} title="Editar">
                        <Edit size={16} />
                      </button>
                      {user.email !== "administracion@distrielectricoseyd.com" && (
                        <button onClick={() => handleDelete(user.id)} style={{ color: "var(--color-danger)" }} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</h3>
              <button type="button" className="btn-close" onClick={handleCloseModal}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label className="form-label">Nombre</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Correo Electrónico</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    required 
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={editingUser?.email === "administracion@distrielectricoseyd.com"}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Identificación</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.identification}
                    onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input 
                    type="tel" 
                    className="form-input" 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select 
                    className="form-input" 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={editingUser?.email === "administracion@distrielectricoseyd.com"}
                  >
                    <option value="CASHIER">Cajero POS</option>
                    <option value="WAREHOUSE">Bodega</option>
                    <option value="FINANCE">Caja/Pagos</option>
                    <option value="OPERATIVE">Operativo (Personalizado)</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                {formData.role === "OPERATIVE" && (
                  <div className="form-group" style={{ background: "var(--color-light-gray)", padding: "1rem", borderRadius: "var(--radius-md)" }}>
                    <label className="form-label" style={{ marginBottom: "0.5rem" }}>Accesos Permitidos</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                      {availableModules.map(mod => (
                        <label key={mod.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", cursor: "pointer" }}>
                          <input 
                            type="checkbox" 
                            checked={formData.modules.includes(mod.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({ ...formData, modules: [...formData.modules, mod.id] });
                              } else {
                                setFormData({ ...formData, modules: formData.modules.filter(m => m !== mod.id) });
                              }
                            }}
                          />
                          {mod.label}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Contraseña {editingUser && "(Dejar en blanco para no cambiar)"}</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" id="close-hr-modal-btn" className="btn btn-outline" onClick={handleCloseModal} disabled={isPending}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
