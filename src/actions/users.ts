"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

export async function createUser(data: { name: string; email: string; role: string; password?: string; identification?: string; phone?: string; modules?: string[]; }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Acceso denegado. Solo administradores pueden crear usuarios." };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return { success: false, error: "Ya existe un usuario con este correo electrónico." };
    }

    if (data.identification) {
      const existingId = await prisma.user.findUnique({
        where: { identification: data.identification },
      });
      if (existingId) {
        return { success: false, error: "Ya existe un usuario con esta identificación." };
      }
    }

    const hashedPassword = await bcrypt.hash(data.password || "admin123", 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        identification: data.identification || null,
        phone: data.phone || null,
        password: hashedPassword,
        role: data.role as any,
        modules: data.modules || [],
      },
    });

    revalidatePath("/hr");
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al crear el usuario." };
  }
}

export async function updateUser(id: string, data: { name: string; email: string; role: string; password?: string; identification?: string; phone?: string; modules?: string[]; }) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Acceso denegado. Solo administradores pueden editar usuarios." };
  }

  try {
    if (data.identification) {
      const existingId = await prisma.user.findUnique({
        where: { identification: data.identification },
      });
      if (existingId && existingId.id !== id) {
        return { success: false, error: "Ya existe otro usuario con esta identificación." };
      }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      identification: data.identification || null,
      phone: data.phone || null,
      role: data.role as any,
      modules: data.modules || [],
    };

    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/hr");
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al actualizar el usuario." };
  }
}

export async function deleteUser(id: string) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return { success: false, error: "Acceso denegado. Solo administradores pueden eliminar usuarios." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.email === "administracion@distrielectricoseyd.com") {
      return { success: false, error: "No puedes eliminar al super administrador principal." };
    }

    await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/hr");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar el usuario." };
  }
}
