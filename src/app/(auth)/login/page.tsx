"use client";

import { useActionState } from "react";
import { authenticate } from "@/actions/auth";
import { Zap, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect } from "react";

export default function LoginPage() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
    undefined
  );

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-[var(--primary)] text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
          <Zap size={32} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">DistriEléctricos</h1>
        <p className="text-gray-500 mt-2 text-center">
          Ingresa tus credenciales para acceder al sistema ERP
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <form action={dispatch} className="space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Correo Electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="admin@ejemplo.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Contraseña
              </label>
            </div>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--primary)] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
            />
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
              <AlertCircle size={16} />
              <p>{errorMessage}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Ingresando...
              </>
            ) : (
              "Ingresar al ERP"
            )}
          </button>
        </form>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} DistriEléctricos E&D. Todos los derechos reservados.
      </div>
    </div>
  );
}
