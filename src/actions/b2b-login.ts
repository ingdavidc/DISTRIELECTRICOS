"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function loginB2B(clientCode: string) {
  if (!clientCode) return { success: false, error: "Código requerido" };

  const request = await prisma.b2BRequest.findUnique({
    where: { clientCode }
  });

  if (!request || request.status !== "APPROVED") {
    return { success: false, error: "Código inválido o inactivo." };
  }

  // Set cookie valid for 30 days
  const cookieStore = await cookies();
  cookieStore.set("b2b_code", clientCode, {
    maxAge: 30 * 24 * 60 * 60,
    path: "/"
  });

  return { success: true, companyName: request.companyName };
}

export async function logoutB2B() {
  const cookieStore = await cookies();
  cookieStore.delete("b2b_code");
  return { success: true };
}

export async function getB2BUser() {
  const cookieStore = await cookies();
  const code = cookieStore.get("b2b_code")?.value;
  
  if (!code) return null;

  const request = await prisma.b2BRequest.findUnique({
    where: { clientCode: code },
    select: { companyName: true, clientCode: true }
  });

  return request;
}
