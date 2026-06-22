/**
 * Utilidad para comunicarse con n8n de manera asíncrona (Fire-and-forget).
 * Esto evita que el usuario tenga que esperar a que n8n responda para ver la confirmación en pantalla.
 */

const N8N_URL = process.env.N8N_URL || "http://localhost:5678/webhook";

export async function triggerN8nWebhook(webhookId: string, payload: any) {
  try {
    const url = `${N8N_URL}/${webhookId}`;
    
    // Fire and forget: No esperamos el await completo en el hilo principal
    // para no bloquear la caja registradora.
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        timestamp: new Date().toISOString(),
        source: "distrielectricos-erp"
      })
    }).catch(err => {
      // Si n8n está apagado, simplemente logueamos el error sin romper el ERP
      console.warn(`[N8N] Webhook ${webhookId} falló silenciosamente:`, err.message);
    });

  } catch (error) {
    console.warn(`[N8N] Error inesperado disparando webhook ${webhookId}:`, error);
  }
}
