"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendWhatsAppTemplate, sendWhatsAppMessage } from "@/lib/whatsapp";
import { auth } from "@/auth";

export type B2BFormData = {
  companyName: string;
  nit: string;
  contactName: string;
  email: string;
  phone: string;
  rutUrl: string;
};

// 1. Submit Request & Send OTP
export async function requestB2BAccess(data: B2BFormData) {
  try {
    // Verificar si ya existe una solicitud verificada para este NIT o Email
    const existing = await prisma.b2BRequest.findFirst({
      where: {
        OR: [{ nit: data.nit }, { email: data.email }],
        isVerified: true
      }
    });

    if (existing) {
      return { success: false, error: "Ya existe una solicitud corporativa para este NIT o Email." };
    }

    // Generar OTP (6 dígitos)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15); // expira en 15 minutos

    const request = await prisma.b2BRequest.create({
      data: {
        ...data,
        whatsappCode: otp,
        codeExpiresAt: expires,
        isVerified: false,
        status: "PENDING"
      }
    });

    // Enviar WhatsApp OTP usando template
    await sendWhatsAppTemplate(data.phone, "codigo_verificacion_otp", [otp]);

    return { success: true, requestId: request.id };
  } catch (error: any) {
    console.error("Error in requestB2BAccess:", error);
    return { success: false, error: "Error al procesar la solicitud" };
  }
}

// 2. Verify OTP
export async function verifyB2BCode(requestId: string, code: string) {
  try {
    const request = await prisma.b2BRequest.findUnique({ where: { id: requestId } });
    if (!request) return { success: false, error: "Solicitud no encontrada" };

    if (request.isVerified) return { success: true }; // ya estaba verificada

    if (request.whatsappCode !== code) {
      return { success: false, error: "Código incorrecto" };
    }

    if (request.codeExpiresAt && new Date() > request.codeExpiresAt) {
      return { success: false, error: "El código ha expirado. Por favor, solicita uno nuevo." };
    }

    await prisma.b2BRequest.update({
      where: { id: requestId },
      data: { isVerified: true, whatsappCode: null, codeExpiresAt: null }
    });

    // Enviar WA de confirmación (dejamos como text, si falla fuera de 24h no es crítico)
    const msg = `✅ ¡Código verificado!\n\nHemos recibido tu solicitud corporativa. Nuestro equipo la revisará y te notificaremos pronto con tu código de acceso.`;
    await sendWhatsAppMessage(request.phone, msg);

    return { success: true };
  } catch (error) {
    console.error("Error in verifyB2BCode:", error);
    return { success: false, error: "Error de verificación" };
  }
}

// 3. Admin: Get Requests
export async function getB2BRequests() {
  const session = await auth();
  if (!session?.user) throw new Error("NO_AUTH");

  const data = await prisma.b2BRequest.findMany({
    orderBy: { createdAt: "desc" }
  });
  return JSON.parse(JSON.stringify(data));
}

// 4. Admin: Approve Request
export async function approveB2BRequest(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("NO_AUTH");

  try {
    const request = await prisma.b2BRequest.findUnique({ where: { id } });
    if (!request) return { success: false, error: "No encontrado" };

    if (request.status === "APPROVED") return { success: false, error: "Ya estaba aprobado" };

    // Generar código de cliente (ej: CORP-8A2F)
    const clientCode = "CORP-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    const updated = await prisma.b2BRequest.update({
      where: { id },
      data: { status: "APPROVED", clientCode }
    });

    revalidatePath("/(admin)/b2b-requests", "page");

    // Enviar WA de aprobación con plantilla
    await sendWhatsAppTemplate(request.phone, "cuenta_aprobada", [request.contactName]);

    return { success: true, clientCode };
  } catch (error: any) {
    console.error("Error approving:", error);
    return { success: false, error: error.message };
  }
}

// 5. Admin: Reject Request
export async function rejectB2BRequest(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("NO_AUTH");

  try {
    const request = await prisma.b2BRequest.update({
      where: { id },
      data: { status: "REJECTED" }
    });

    revalidatePath("/(admin)/b2b-requests", "page");

    // Notificar al cliente (Texto libre, puede fallar por regla de 24h)
    const msg = `Hola ${request.contactName},\n\nTu solicitud de acceso corporativo no ha podido ser aprobada en este momento. Si tienes dudas, por favor contáctanos.`;
    await sendWhatsAppMessage(request.phone, msg);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
