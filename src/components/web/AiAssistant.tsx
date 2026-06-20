"use client";

import { useState } from "react";
import Image from "next/image";
import { X, MessageSquare, Send } from "lucide-react";

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 100, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      
      {/* Chat Window */}
      {isOpen && (
        <div style={{ 
          width: "350px", height: "450px", background: "white", 
          borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", 
          marginBottom: "1rem", display: "flex", flexDirection: "column", overflow: "hidden",
          border: "1px solid var(--color-border)",
          animation: "slideUp 0.3s ease-out"
        }}>
          {/* Header */}
          <div style={{ background: "var(--color-primary)", color: "white", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "white", overflow: "hidden", border: "2px solid var(--color-secondary)" }}>
                 <Image src="/capybara.png" alt="Capi IA" width={40} height={40} style={{ objectFit: "cover" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem" }}>Capi, El Electricista</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)" }}>Asistente IA en línea</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ color: "white" }}>
              <X size={20} />
            </button>
          </div>

          {/* Chat Body */}
          <div style={{ flex: 1, background: "var(--color-background)", padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ background: "white", padding: "1rem", borderRadius: "var(--radius-lg)", borderBottomLeftRadius: "0", boxShadow: "var(--shadow-sm)", maxWidth: "85%", fontSize: "0.95rem" }}>
              ¡Hola! Soy Capi 🦦⚡️ ¿En qué te puedo ayudar hoy? ¿Necesitas calcular los materiales para tu proyecto o buscas algún repuesto en específico?
            </div>
          </div>

          {/* Input Area */}
          <div style={{ padding: "1rem", background: "white", borderTop: "1px solid var(--color-border)", display: "flex", gap: "0.5rem" }}>
            <input 
              type="text" 
              placeholder="Escribe tu consulta aquí..." 
              style={{ flex: 1, padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", outline: "none", fontSize: "0.9rem" }}
            />
            <button style={{ background: "var(--color-secondary)", color: "white", padding: "0.75rem", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button / Avatar */}
      <div style={{
        animation: isOpen ? "none" : "float 3s ease-in-out infinite",
        position: "relative"
      }}>
        {!isOpen && (
          <div style={{
            position: "absolute",
            bottom: "95px",
            right: "0",
            background: "white",
            padding: "0.75rem 1rem",
            borderRadius: "var(--radius-lg)",
            borderBottomRightRadius: "0",
            boxShadow: "var(--shadow-md)",
            border: "1px solid var(--color-border)",
            whiteSpace: "nowrap",
            fontWeight: 600,
            color: "var(--color-primary)",
            fontSize: "0.95rem",
            transformOrigin: "bottom right",
            animation: "popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}>
            👋 Hola, estoy aquí para ayudarte
            <div style={{
              position: "absolute",
              bottom: "-6px",
              right: "0",
              width: "12px",
              height: "12px",
              background: "white",
              borderBottom: "1px solid var(--color-border)",
              borderRight: "1px solid var(--color-border)",
              transform: "rotate(45deg)"
            }}></div>
          </div>
        )}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          style={{ 
            width: "90px", height: "90px", borderRadius: "50%", 
            background: "var(--color-primary)", border: "4px solid white",
            boxShadow: "var(--shadow-lg)", position: "relative",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.3s",
            transform: isOpen ? "scale(0.9)" : "scale(1)",
            padding: 0,
            cursor: "pointer"
          }}
        >
          <Image 
            src="/chappy.png" 
            alt="Capi Assistant" 
            fill 
            style={{ 
              objectFit: "cover", 
              borderRadius: "50%",
              transformOrigin: "bottom center",
              animation: "waveGreeting 4s infinite"
            }} 
          />
          {/* Notification dot */}
          {!isOpen && (
            <div style={{ position: "absolute", top: "10px", right: "10px", width: "20px", height: "20px", background: "var(--color-danger)", borderRadius: "50%", border: "2px solid white", zIndex: 10 }}></div>
          )}
        </button>
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
          100% { transform: translateY(0px); }
        }
        @keyframes waveGreeting {
          0% { transform: rotate(0deg) scale(1); }
          10% { transform: rotate(15deg) scale(1.05); }
          20% { transform: rotate(-10deg) scale(1.05); }
          30% { transform: rotate(15deg) scale(1.05); }
          40% { transform: rotate(-10deg) scale(1.05); }
          50%, 100% { transform: rotate(0deg) scale(1); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.5); }
          80% { transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
