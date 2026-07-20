export async function sendWhatsAppMessage(toPhone: string, messageText: string) {
  try {
    const token = process.env.META_WA_TOKEN;
    const phoneId = process.env.META_WA_PHONE_ID;

    if (!token || !phoneId) {
      console.warn("⚠️ WhatsApp Meta Cloud API no está configurada. Faltan META_WA_TOKEN o META_WA_PHONE_ID.");
      console.log(`[SIMULACIÓN WA] Mensaje a ${toPhone}: ${messageText}`);
      // Simulamos éxito para desarrollo si no hay token
      return { success: true, simulated: true };
    }

    // Limpiar el teléfono para que solo tenga números
    const cleanPhone = toPhone.replace(/\D/g, "");

    const url = `https://graph.facebook.com/v17.0/${phoneId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "text",
      text: {
        body: messageText
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Error enviando WhatsApp:", errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("❌ Error interno en sendWhatsAppMessage:", error);
    return { success: false, error: "Internal Error" };
  }
}
