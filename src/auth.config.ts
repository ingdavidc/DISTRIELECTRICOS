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
        nextUrl.pathname.startsWith("/forgot-password") ||
        nextUrl.pathname.startsWith("/reset-password") ||
        nextUrl.pathname.startsWith("/receipt") ||
        nextUrl.pathname.startsWith("/api/auth");

      if (isPublicRoute) return true;
      if (isLoggedIn) return true;
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
