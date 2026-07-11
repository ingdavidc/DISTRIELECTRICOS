"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";
import { cookies } from "next/headers";
import { z } from "zod";

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

    cookies().set("show_welcome", "true", { path: "/" });
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
    const user = await prisma.user.findUnique({
      where: { identification: parsed.data.identification }
    });

    let redirectTo = "/";
    if (user) {
      if (user.role === "CASHIER") redirectTo = "/pos";
      else if (user.role === "WAREHOUSE") redirectTo = "/dispatch";
      else if (user.role === "FINANCE") redirectTo = "/payments";
      else if (user.role === "ADMIN") redirectTo = "/dashboard";
      else if (user.role === "OPERATIVE" && user.modules.length > 0) redirectTo = user.modules[0];
    }

    cookies().set("show_welcome", "true", { path: "/" });
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

export async function logOut() {
  await signOut({ redirectTo: "/login" });
}
