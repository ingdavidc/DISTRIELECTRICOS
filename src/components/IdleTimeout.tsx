"use client";

import { useEffect, useRef, useState } from "react";
import { logOut } from "@/actions/auth";

// 30 minutos en milisegundos
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; 

export default function IdleTimeout() {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Guardamos un ref para evitar que la función se llame múltiples veces
  // si el usuario se sigue moviendo después del timeout (aunque redirigirá)
  const isLoggingOutRef = useRef(false);

  useEffect(() => {
    const handleActivity = () => {
      if (isLoggingOutRef.current) return;

      // Reseteamos el temporizador
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        isLoggingOutRef.current = true;
        setIsIdle(true);
        try {
          // Llama al Server Action para cerrar sesión (registra en logs y hace signOut)
          await logOut();
        } catch (error) {
          console.error("Error al cerrar sesión por inactividad", error);
        }
      }, IDLE_TIMEOUT_MS);
    };

    // Registrar eventos de actividad
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("scroll", handleActivity);

    // Iniciar el temporizador la primera vez
    handleActivity();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("scroll", handleActivity);
    };
  }, []);

  return null; // Este componente no renderiza nada visible
}
