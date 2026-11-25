"use client";

import { Bell, Search, UserCircle, LogOut } from "lucide-react";
import { logOut } from "@/actions/auth";
import GlobalSearch from "./GlobalSearch";

import { signOut } from "next-auth/react";

export default function Navbar({ user }: { user?: any }) {
  const handleLogout = async () => {
    await logOut();
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", flex: "1 1 auto", maxWidth: "420px", minWidth: "180px" }}>
        <GlobalSearch />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
        <button type="button" style={{ color: "var(--color-text-muted)", display: "flex", alignItems: "center", padding: "0.35rem" }}>
          <Bell size={24} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderLeft: "1px solid var(--color-border)", paddingLeft: "1rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{user?.name || "Usuario"}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{user?.role || "Admin"}</div>
          </div>
          <UserCircle size={32} color="var(--color-primary)" />
          
          <button 
            type="button"
            onClick={handleLogout}
            style={{ marginLeft: "0.35rem", padding: "0.45rem", borderRadius: "9999px", color: "var(--color-danger)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background-color 0.2s" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fee2e2"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            title="Cerrar sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
