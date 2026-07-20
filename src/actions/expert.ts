"use server";

import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// 1. Solicitar Acceso (Crea registro y envía OTP)
export async function requestExpertAccess(data: {
  name: string;
  document: string;
  email: string;
  phone: string;
  passwordRaw: string;
}) {
  try {
    // Check if phone or document is already an expert user
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { identification: data.document }
        ],
        role: "EXPERT"
      }
    });

    if (existingUser) {
      return { success: false, error: "Ya existe un usuario con ese correo o documento." };
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Hash password
    const hashedPassword = await bcrypt.hash(data.passwordRaw, 10);

    const request = await prisma.expertRequest.create({
      data: {
        name: data.name,
        document: data.document,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        whatsappCode: otpCode,
        codeExpiresAt: expiresAt,
        status: "PENDING"
      }
    });

    // Send OTP
    await sendWhatsAppMessage(data.phone, `¡Hola! Tu código de verificación para Aliados Expertos de DISTRIELECTRICOS es: *${otpCode}*\n\nEste código expirará en 15 minutos.`);

    return { success: true, requestId: request.id };
  } catch (error: any) {
    console.error("Error in requestExpertAccess:", error);
    return { success: false, error: "Hubo un error al procesar tu solicitud." };
  }
}

// 2. Verificar Código OTP
export async function verifyExpertCode(requestId: string, code: string) {
  try {
    const request = await prisma.expertRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return { success: false, error: "Solicitud no encontrada" };
    if (request.isVerified) return { success: false, error: "Ya está verificado" };
    if (request.whatsappCode !== code) return { success: false, error: "Código incorrecto" };
    if (request.codeExpiresAt && request.codeExpiresAt < new Date()) {
      return { success: false, error: "El código ha expirado" };
    }

    await prisma.expertRequest.update({
      where: { id: requestId },
      data: {
        isVerified: true,
        whatsappCode: null,
        codeExpiresAt: null
      }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Hubo un error al verificar." };
  }
}

// 3. Admin: Aprobar Solicitud
export async function approveExpertRequest(id: string) {
  try {
    const request = await prisma.expertRequest.findUnique({ where: { id } });
    if (!request || !request.isVerified) return { success: false, error: "No verificado o inválido" };

    // Create User with EXPERT role
    const user = await prisma.user.create({
      data: {
        name: request.name,
        email: request.email,
        identification: request.document,
        phone: request.phone,
        password: request.password,
        role: "EXPERT"
      }
    });

    await prisma.expertRequest.update({
      where: { id },
      data: { status: "APPROVED" }
    });

    // Notify WhatsApp
    await sendWhatsAppMessage(
      request.phone,
      `¡Hola ${request.name}! Tu solicitud como Aliado Experto ha sido APROBADA.\n\nYa puedes iniciar sesión en www.distrielectricoseyd.com/aliados usando tu correo electrónico y la contraseña que creaste.\n\n¡Bienvenido a los precios especiales!`
    );

    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { success: false, error: "Error al aprobar la solicitud" };
  }
}

// 4. Admin: Rechazar Solicitud
export async function rejectExpertRequest(id: string) {
  try {
    await prisma.expertRequest.update({
      where: { id },
      data: { status: "REJECTED" }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Error al rechazar" };
  }
}

// 5. Login Experto
export async function loginExpert(email: string, passwordRaw: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || user.role !== "EXPERT") {
      return { success: false, error: "Credenciales inválidas o no eres Aliado Experto." };
    }

    const match = await bcrypt.compare(passwordRaw, user.password);
    if (!match) {
      return { success: false, error: "Contraseña incorrecta." };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("expert_session", user.id, {
      maxAge: 30 * 24 * 60 * 60,
      path: "/"
    });

    return { success: true, name: user.name };
  } catch (e: any) {
    return { success: false, error: "Error al iniciar sesión." };
  }
}

// 6. Logout Experto
export async function logoutExpert() {
  const cookieStore = await cookies();
  cookieStore.delete("expert_session");
  return { success: true };
}

// 7. Get Current Expert
export async function getExpertUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("expert_session")?.value;
  
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true }
  });

  return user;
}
