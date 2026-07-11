"use client";

import { Bell, Search, UserCircle, LogOut } from "lucide-react";
import { logOut } from "@/actions/auth";

export default function Navbar({ user }: { user?: any }) {
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", width: "300px" }}>
        <div style={{ position: "relative", width: "100%" }}>
          <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="input" 
            style={{ paddingLeft: "35px", borderRadius: "9999px", background: "var(--color-background)" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button style={{ color: "var(--color-text-muted)" }}>
          <Bell size={24} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderLeft: "1px solid var(--color-border)", paddingLeft: "1rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{user?.name || "Usuario"}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{user?.role || "Admin"}</div>
          </div>
          <UserCircle size={32} color="var(--color-primary)" />
          
          <button 
            onClick={() => logOut()}
            className="ml-2 p-2 hover:bg-gray-100 rounded-full transition-colors text-red-500"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
