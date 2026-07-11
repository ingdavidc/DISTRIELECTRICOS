"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function requestPasswordReset(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return { success: true };
    }

    // Generate a secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt,
      },
    });

    // Generate reset URL (Using standard NEXT_PUBLIC_SITE_URL or Vercel specific env)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "[Pega-Aqui-Tu-LLave-Resend]") {
      await resend.emails.send({
        from: "DistriEléctricos <onboarding@resend.dev>", // Or a verified domain if available
        to: email,
        subject: "Recuperación de Contraseña - DistriEléctricos",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Recuperación de Contraseña</h2>
            <p>Hola ${user.name || ""},</p>
            <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva:</p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #203562; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">Este enlace expirará en 1 hora.</p>
            <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
          </div>
        `,
      });
    } else {
      console.log("SIMULATING EMAIL SEND - URL:", resetUrl);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Password reset request error:", error);
    return { success: false, error: "Ocurrió un error al procesar tu solicitud." };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return { success: false, error: "El token es inválido o no existe." };
    }

    if (resetToken.expiresAt < new Date()) {
      return { success: false, error: "El token ha expirado. Por favor, solicita uno nuevo." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    });

    // Delete used token
    await prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Password reset error:", error);
    return { success: false, error: "Ocurrió un error al restablecer tu contraseña." };
  }
}
