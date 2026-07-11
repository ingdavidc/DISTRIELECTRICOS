"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * Registers an action log for a given user.
 */
export async function logUserAction(action: string, details?: string, userIdOverride?: string) {
  try {
    const session = await auth();
    const userId = userIdOverride || session?.user?.id;
    
    if (!userId) return; // We cannot log without a user

    await prisma.userLog.create({
      data: {
        userId,
        action,
        details
      }
    });
  } catch (error) {
    console.error("Error logging user action:", error);
    // We intentionally don't throw to prevent failing the main transaction
  }
}

/**
 * Retrieves the recent action logs for a specific user.
 */
export async function getUserLogs(userId: string) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const logs = await prisma.userLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit to last 100 actions to keep it light
    });

    return JSON.parse(JSON.stringify(logs));
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return [];
  }
}
