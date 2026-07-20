import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  session: { 
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutos
    updateAge: 5 * 60, // Actualizar la cookie si hay actividad
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublicRoute =
        nextUrl.pathname === "/" ||
        nextUrl.pathname.startsWith("/catalog") ||
        nextUrl.pathname.startsWith("/cotizar") ||
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/login-corp") ||
        nextUrl.pathname.startsWith("/aliados") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password") ||
        nextUrl.pathname.startsWith("/receipt") ||
        nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname.startsWith("/api/whatsapp");

      if (isPublicRoute) return true;
      if (isLoggedIn) {
        const user = auth?.user as any;
        const role = user?.role;
        const modules = user?.modules || [];
        const pathname = nextUrl.pathname;
        
        // ADMIN tiene acceso global
        if (role === "ADMIN") return true;
        
        // EXPERT y CUSTOMER están restringidos a sus portales específicos
        if (role === "EXPERT" && !pathname.startsWith("/aliados")) {
          return Response.redirect(new URL("/aliados/dashboard", nextUrl));
        }
        if (role === "CUSTOMER" && !pathname.startsWith("/profile")) {
          return Response.redirect(new URL("/profile", nextUrl));
        }

        // Reglas de acceso estrictas por rol para módulos ERP
        const routeConfig: Record<string, string[]> = {
          "/dashboard": ["ADMIN"],
          "/website": ["ADMIN"],
          "/pos": ["ADMIN", "CASHIER", "OPERATIVE"],
          "/payments": ["ADMIN", "FINANCE", "OPERATIVE"],
          "/customers": ["ADMIN", "CASHIER", "OPERATIVE"],
          "/inventory": ["ADMIN", "WAREHOUSE", "OPERATIVE"],
          "/dispatch": ["ADMIN", "WAREHOUSE", "OPERATIVE"],
          "/quotes": ["ADMIN", "OPERATIVE"],
          "/purchases": ["ADMIN", "OPERATIVE"],
          "/suppliers": ["ADMIN", "OPERATIVE"],
          "/b2b-requests": ["ADMIN"],
          "/expert-requests": ["ADMIN"],
          "/hr": ["ADMIN"],
        };

        const matchedRoute = Object.keys(routeConfig).find(route => pathname.startsWith(route));
        
        if (matchedRoute) {
          const allowedRoles = routeConfig[matchedRoute];
          
          // 1. Verificar si el rol tiene permiso para este módulo
          if (!allowedRoles.includes(role)) {
             return false; // Denegar acceso (redirige a login o fallback)
          }
          
          // 2. Si es OPERATIVE, verificar si tiene el módulo explícitamente asignado
          if (role === "OPERATIVE") {
             if (!modules.includes(matchedRoute)) {
                return false; 
             }
          }
        }
        
        return true;
      }
      return false; // Redirigir a /login
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.modules = (user as any).modules || [];
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        (session.user as any).modules = token.modules || [];
      }
      return session;
    },
  },
  providers: [],
};
