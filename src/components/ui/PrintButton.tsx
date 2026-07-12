"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button 
      onClick={() => window.print()}
      style={{ 
        backgroundColor: "#203562", 
        color: "white", 
        border: "none", 
        padding: "0.75rem 1.5rem", 
        borderRadius: "4px", 
        fontSize: "1rem", 
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem"
      }}
    >
      <Printer size={18} />
      Descargar PDF / Imprimir
    </button>
  );
}
