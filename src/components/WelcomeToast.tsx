"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

const MESSAGES = [
  "¡La energía de hoy es el éxito de mañana!",
  "¡Tu esfuerzo ilumina nuestro trabajo!",
  "¡Cada detalle cuenta, hagamos un gran trabajo!",
  "¡La calidad es nuestro mejor enchufe con el cliente!",
  "¡Conecta con tus metas, hoy es un gran día!",
  "¡Hacemos que las grandes ideas cobren energía!",
  "¡Juntos somos la chispa que mueve la empresa!"
];

export default function WelcomeToast({ userName }: { userName: string }) {
  useEffect(() => {
    const hasCookie = document.cookie.includes("show_welcome=true");
    if (hasCookie) {
      // Determinar mensaje basado en la semana del año para que cambie cada semana
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const diff = now.getTime() - start.getTime();
      const oneWeek = 1000 * 60 * 60 * 24 * 7;
      const weekNumber = Math.floor(diff / oneWeek);
      
      const message = MESSAGES[weekNumber % MESSAGES.length];
      const displayName = userName || "Equipo";
      
      toast.success(
        (t) => (
          <div>
            <b style={{ fontSize: "1.05rem" }}>¡Bienvenido/a, {displayName}!</b>
            <p style={{ margin: "4px 0 0", fontSize: "0.9rem", opacity: 0.9 }}>{message}</p>
          </div>
        ),
        { 
          duration: 6000, 
          style: { 
            background: "var(--color-primary)", 
            color: "white",
            padding: "1rem",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
          }, 
          icon: "👋" 
        }
      );
      
      // Borrar la cookie para que no vuelva a salir hasta el próximo login
      document.cookie = "show_welcome=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }, [userName]);

  return null;
}
