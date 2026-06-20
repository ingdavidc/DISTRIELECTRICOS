"use client";

import { Plus, Search, UserCheck } from "lucide-react";

export default function HRPage() {
  const users = [
    { id: "USR-001", name: "Carlos Admin", email: "carlos@distrielectricos.com", role: "Administrador", status: "Activo", lastLogin: "Hace 5 minutos" },
    { id: "USR-002", name: "Maria Ventas", email: "maria@distrielectricos.com", role: "Vendedor POS", status: "Activo", lastLogin: "Hace 2 horas" },
    { id: "USR-003", name: "Juan Bodega", email: "juan@distrielectricos.com", role: "Operario Bodega", status: "Inactivo", lastLogin: "Hace 2 días" },
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
        <button className="btn btn-primary">
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
            <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main)" }}>12</div>
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
            />
          </div>
        </div>

        <div className="data-table-container" style={{ border: "none", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Último Acceso</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 600 }}>{user.id}</td>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span style={{ 
                      background: "var(--color-light-gray)", 
                      padding: "0.2rem 0.5rem", 
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontWeight: 500
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td>{user.lastLogin}</td>
                  <td>
                    <span className={`badge ${user.status === 'Activo' ? 'badge-success' : 'badge-danger'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button style={{ color: "var(--color-secondary)", fontWeight: 500, fontSize: "0.85rem" }}>Gestionar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
