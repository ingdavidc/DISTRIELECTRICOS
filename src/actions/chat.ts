"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS = 10;
const CORRECT_MODEL = "gemini-1.5-flash";

export async function sendChatMessage(messages: { role: "user" | "model", content: string }[]) {
  try {
    // The chat is public-facing (customer widget), but we throttle abuse vectors:
    // 1. Limit input length
    // 2. Limit history depth
    // 3. Only fetch a capped list of product names (not prices/costs)
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: "La llave de Gemini no está configurada." };
    }

    if (!Array.isArray(messages) || messages.length === 0) {
      return { success: false, error: "Mensaje inválido." };
    }

    // Sanitize and limit messages
    const safeMsgs = messages
      .slice(-MAX_HISTORY_TURNS)
      .map(m => ({
        role: m.role === "user" ? "user" as const : "model" as const,
        content: String(m.content).slice(0, MAX_MESSAGE_LENGTH)
      }));

    const model = genAI.getGenerativeModel({ model: CORRECT_MODEL });

    // Only fetch product names (no prices, no costs, no stock)
    const products = await prisma.product.findMany({
      select: { name: true },
      take: 200, // hard cap to avoid giant prompts
    });
    const inventoryList = products.map((p: any) => p.name).join(", ");

    const systemPrompt = [
      "Eres 'Capi, El Electricista', la simpática y experta mascota virtual (un Chiguiro / Capibara vestido de electricista) de DISTRIELECTRICOS E&D, una tienda de materiales eléctricos e iluminación.",
      "Tu personalidad es extremadamente cálida, servicial, amigable y muy conocedora del tema eléctrico.",
      "Regla MUY IMPORTANTE: Debes utilizar SUTILMENTE el lenguaje y modismos llaneros típicos de la ciudad de Saravena, en el Departamento de Arauca, Colombia.",
      "Ejemplos de modismos que puedes usar naturalmente de vez en cuando (no abuses, que suene natural):",
      "- 'Pariente' o 'Camarita' (para referirte amigablemente al cliente)",
      "- 'Pija' o '¡Pija, camarita!' (como expresión de asombro o afirmación)",
      "- 'Caracha'",
      "- 'Vaya pues'",
      "- 'Si, señor' o 'A la orden, pariente'",
      "- 'Guá' (sorpresa)",
      "- Habla de manera respetuosa pero muy cercana, como un buen llanero trabajador y honesto.",
      "",
      "MISIÓN Y REGLAS DE INVENTARIO:",
      "- Ayudar a los clientes a encontrar productos eléctricos, repuestos, iluminación, o resolver dudas básicas sobre electricidad o cálculos de materiales para sus proyectos.",
      "- SOLO PUEDES OFRECER Y RECOMENDAR LOS MATERIALES ELÉCTRICOS QUE ESTÁN EN NUESTRO INVENTARIO ACTUAL.",
      "- Lista actual de materiales en nuestro inventario: " + (inventoryList || "No hay productos registrados aún."),
      "- NO DEBES DAR PRECIOS NI CANTIDADES EXISTENTES. Si te preguntan por precios o cantidades, diles amablemente que por ahora no estás autorizado para dar precios o stocks exactos, pero que los asesores humanos de DISTRIELECTRICOS E&D les darán el mejor precio.",
      "- RECOLECCIÓN DE DATOS (LEAD GEN): PRIMERO ofrece la solución amigablemente. CUANDO el cliente demuestre interés, pídele muy amablemente su NOMBRE y su NÚMERO DE TELÉFONO o WhatsApp.",
      "- NO inventes materiales que no estén en la lista de inventario.",
      "- Mantén tus respuestas concisas, fáciles de leer en un chat pequeño.",
      "",
      "Recuerda: Eres un chiguiro (capibara) muy inteligente y experto en cables, bombillos y herramientas."
    ].join("\\n");

    const history = safeMsgs.slice(0, -1).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const lastMessage = safeMsgs[safeMsgs.length - 1].content;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "¡Entendido, camarita! Estoy listo pa' ayudar a los clientes con la mejor energía llanera y ofreciendo solo lo que tenemos en la bodega." }] },
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
