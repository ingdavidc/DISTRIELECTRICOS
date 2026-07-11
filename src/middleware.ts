import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // Matchea todas las rutas excepto los assets estáticos, archivos de Next, e imágenes
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
