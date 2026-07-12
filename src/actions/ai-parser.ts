"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function parsePdfInvoice(formData: FormData) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { success: false, error: "La llave de API de Gemini no está configurada en el servidor." };
    }

    const file = formData.get("file") as File;
    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo." };
    }

    // ── File validation ──────────────────────────────────────────────────────
    const MAX_SIZE_MB = 10;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return { success: false, error: `El archivo no puede superar ${MAX_SIZE_MB} MB.` };
    }
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Solo se permiten archivos PDF o imágenes (JPG, PNG, WEBP)." };
    }
    const mimeType = file.type as "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const prompt = [
      "Eres un asistente experto en contabilidad e inventarios de una empresa llamada DISTRIELECTRICOS E&D.",
      "He adjuntado una factura de proveedor en formato PDF. Tu trabajo es extraer los datos clave para insertarlos en nuestro sistema ERP.",
      "",
      "Debes devolver UNICAMENTE un objeto JSON valido con esta estructura exacta, sin texto adicional, sin formato markdown:",
      "{",
      "  \"supplier\": {",
      "    \"name\": \"Nombre de la empresa proveedora\",",
      "    \"identification\": \"NIT o RUT (solo numeros)\",",
      "    \"email\": \"correo si aparece\",",
      "    \"phone\": \"telefono si aparece\"",
      "  },",
      "  \"products\": [",
      "    {",
      "      \"sku\": \"Codigo del producto si aparece, o genera uno corto basado en el nombre\",",
      "      \"name\": \"Nombre descriptivo del producto\",",
      "      \"quantity\": 10,",
      "      \"cost\": 15000.50,",
      "      \"tax\": 19",
      "    }",
      "  ]",
      "}",
      "",
      "Reglas:",
      "1. El 'cost' debe ser numerico sin simbolos de moneda.",
      "2. El 'tax' debe ser numerico (ej: 19 o 5), si no se menciona asume 19.",
      "3. Extrae TODOS los productos de la factura.",
      "4. Si el PDF es un recibo escaneado o imagen, leelo igual y extrae lo mejor posible."
    ].join("\n");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    
    const cleanedJson = responseText.replace(/```json\n?|```/g, "").trim();

    try {
      const parsedData = JSON.parse(cleanedJson);
      return { success: true, data: parsedData };
    } catch (parseError) {
      console.error("Error parseando JSON de Gemini:", responseText);
      return { success: false, error: "La IA no devolvio un formato valido. Intenta de nuevo." };
    }

  } catch (error: any) {
    console.error("Error en parsePdfInvoice:", error);
    return { success: false, error: "Error de conexion con la IA o procesamiento del archivo." };
  }
}
