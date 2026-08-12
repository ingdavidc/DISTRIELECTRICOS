/**
 * Utilidad para comunicarse con n8n de manera asíncrona (Fire-and-forget).
 * Esto evita que el usuario tenga que esperar a que n8n responda para ver la confirmación en pantalla.
 */

const N8N_URL = process.env.N8N_URL || "http://localhost:5678/webhook";

export async function triggerN8nWebhook(webhookId: string, payload: any) {
  try {
    const url = process.env.MAKE_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL || `${N8N_URL}/${webhookId}`;
    
    // En entornos Serverless como Vercel, si no usamos "await", la función termina y mata
    // la petición antes de que salga hacia Make.com.
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: "distrielectricos-erp"
      })
    });

  } catch (error) {
    console.warn(`[N8N] Error inesperado disparando webhook ${webhookId}:`, error);
  }
}
