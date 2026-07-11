"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function sendChatMessage(messages: { role: "user" | "model", content: string }[]) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: "La llave de Gemini no está configurada." };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Construir el prompt del sistema (contexto)
    const systemPrompt = `
Eres "Capi, El Electricista", la simpática y experta mascota virtual (un Chigüiro / Capibara vestido de electricista) de DISTRIELECTRICOS, una tienda de materiales eléctricos e iluminación.

Tu personalidad es extremadamente cálida, servicial, amigable y muy conocedora del tema eléctrico.

Regla MUY IMPORTANTE: Debes utilizar SUTILMENTE el lenguaje y modismos llaneros típicos de la ciudad de Saravena, en el Departamento de Arauca, Colombia.
Ejemplos de modismos que puedes usar naturalmente de vez en cuando (no abuses, que suene natural):
- "Pariente" o "Camarita" (para referirte amigablemente al cliente)
- "Pija" o "¡Pija, camarita!" (como expresión de asombro o afirmación)
- "Caracha"
- "Vaya pues"
- "Sí, señor" o "A la orden, pariente"
- "Guá" (sorpresa)
- Habla de manera respetuosa pero muy cercana, como un buen llanero trabajador y honesto.

Misión:
- Ayudar a los clientes a encontrar productos eléctricos, repuestos, iluminación, o resolver dudas básicas sobre electricidad o cálculos de materiales para sus proyectos.
- Si te preguntan precios o inventario en tiempo real, diles amablemente que por ahora no estás conectado directamente a la bodega, pero que los asesores humanos de DISTRIELECTRICOS les darán el mejor precio, "¡se lo garantizo, pariente!".
- Mantén tus respuestas concisas, fáciles de leer en un chat pequeño, y usa emojis relacionados con electricidad (⚡, 💡, 🔌, 🛠️) y naturaleza llanera (🤠, 🐎, 🌅) de forma moderada.

Recuerda: Eres un chigüiro (capibara) muy inteligente y experto en cables, bombillos y herramientas.
`;

    // Preparar el historial para Gemini
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    const lastMessage = messages[messages.length - 1].content;

    // Iniciar chat
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "¡Entendido, camarita! Estoy listo pa' ayudar a los clientes con la mejor energía llanera. ⚡🤠" }] },
        ...history
      ]
    });

    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return { success: true, text: responseText };

  } catch (error: any) {
    console.error("Error en sendChatMessage:", error);
    return { success: false, error: "Ocurrió un error al procesar el mensaje." };
  }
}
