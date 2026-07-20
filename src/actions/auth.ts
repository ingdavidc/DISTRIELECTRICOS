"use server";

import { signIn, signOut, auth } from "@/auth";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

const staffLoginSchema = z.object({
  identification: z.string().min(1, { message: "La identificación es requerida" }),
  password: z.string().min(1, { message: "La contraseña es requerida" }),
});

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
      return "Credenciales inválidas.";
    }

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (user) {
      // Registrar log de inicio de sesión de forma explícita
      await prisma.userLog.create({
        data: { userId: user.id, action: "LOGIN", details: "Inició sesión en el sistema (Admin)" }
      });
    }

    (await cookies()).set("show_welcome", "true", { path: "/", httpOnly: false });
    await signIn("credentials", {
      username: parsed.data.email, // Mapeado a username para auth.ts
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salió mal.";
      }
    }
    throw error;
  }
}

export async function authenticateStaff(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = staffLoginSchema.safeParse(data);

    if (!parsed.success) {
      return "Credenciales inválidas.";
    }

    // Buscamos al usuario temporalmente para saber su rol y decidir a dónde redirigir
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { identification: parsed.data.identification },
          { email: parsed.data.identification }
        ]
      }
    });

    let redirectTo = "/";
    if (user) {
      if (user.role === "CASHIER") redirectTo = "/pos";
      else if (user.role === "WAREHOUSE") redirectTo = "/dispatch";
      else if (user.role === "FINANCE") redirectTo = "/payments";
      else if (user.role === "ADMIN") redirectTo = "/dashboard";
      else if (user.role === "OPERATIVE" && user.modules.length > 0) redirectTo = user.modules[0];
      
      // Registrar log de inicio de sesión de forma explícita
      await prisma.userLog.create({
        data: { userId: user.id, action: "LOGIN", details: "Inició sesión en el sistema (Staff)" }
      });
    }

    (await cookies()).set("show_welcome", "true", { path: "/", httpOnly: false });
    await signIn("credentials", {
      username: parsed.data.identification,
      password: parsed.data.password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salió mal.";
      }
    }
    throw error;
  }
}

export async function authenticateExpert(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    const data = Object.fromEntries(formData.entries());
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
      return "Credenciales inválidas.";
    }

    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email }
    });

    if (!user) {
      return "Credenciales inválidas.";
    }

    if (user.role !== "EXPERT") {
      return "Esta cuenta no tiene rol de Aliado Experto.";
    }

    await prisma.userLog.create({
      data: { userId: user.id, action: "LOGIN", details: "Inició sesión en portal de Aliados" }
    });

    (await cookies()).set("show_welcome", "true", { path: "/", httpOnly: false });
    await signIn("credentials", {
      username: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/aliados/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas.";
        default:
          return "Algo salió mal.";
      }
    }
    throw error;
  }
}

export async function logOut() {
  const session = await auth();
  if (session?.user?.id) {
    try {
      await prisma.userLog.create({
        data: {
          userId: session.user.id,
          action: "LOGOUT",
          details: "Cerró sesión en el sistema",
        }
      });
    } catch (e) {
      console.error("Error logging out", e);
    }
  }
  await signOut({ redirectTo: "/" });
}
