import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { username, password } = parsed.data;

        // Búsqueda por email o por identificación
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: username },
              { identification: username },
            ],
          },
        });

        if (!user || !user.password) return null;

        const passwordsMatch = await bcrypt.compare(
          password,
          user.password
        );
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          modules: user.modules,
        };
      },
    }),
  ],
});
