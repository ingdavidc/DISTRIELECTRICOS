"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
const pdf = require("pdf-parse");

// Iniciar el cliente de Gemini
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

    // Convertir File a Buffer para pdf-parse
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extraer texto del PDF
    let pdfText = "";
    try {
      const data = await pdf(buffer);
      pdfText = data.text;
    } catch (err) {
      console.error("Error extrayendo texto del PDF:", err);
      return { success: false, error: "No se pudo leer el contenido del PDF. Asegúrate de que no esté encriptado." };
    }

    if (!pdfText || pdfText.trim() === "") {
      return { success: false, error: "El PDF parece estar vacío o es una imagen escaneada sin texto." };
    }

    // Preparar el modelo Gemini (usamos 1.5 flash por ser rápido y barato)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Eres un asistente experto en contabilidad e inventarios. 
      A continuación te proporcionaré el texto extraído de una factura PDF de un proveedor.
      Tu trabajo es analizar la factura y extraer la información en el siguiente formato JSON estricto.
      No agregues explicaciones, markdown ni ningún otro texto, SOLO devuelve el JSON válido.

      Formato JSON esperado:
      {
        "supplier": {
          "name": "Nombre o Razón Social del Proveedor",
          "identification": "NIT o Documento del proveedor (solo números y guiones si los hay)",
          "email": "Correo electrónico si aparece, si no, string vacío",
          "phone": "Teléfono si aparece, si no, string vacío"
        },
        "products": [
          {
            "sku": "Código de barras, código interno o referencia del producto",
            "name": "Descripción completa del producto",
            "quantity": Cantidad facturada (número entero o decimal),
            "cost": Costo unitario antes de impuestos (número, sin separadores de miles),
            "tax": Porcentaje de IVA o impuesto (ej: 19 si es 19%, 0 si es exento. Si no especifica, asume 19)
          }
        ]
      }

      Texto de la factura:
      """
      ${pdfText.substring(0, 30000)} // Limitamos por si es extremadamente largo
      """
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Limpiar posible markdown (```json ... ```)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const parsedData = JSON.parse(text);
      return { success: true, data: parsedData };
    } catch (parseError) {
      console.error("Error parseando JSON de Gemini:", text);
      return { success: false, error: "La IA no pudo estructurar correctamente los datos de esta factura." };
    }

  } catch (error: any) {
    console.error("Error en parsePdfInvoice:", error);
    return { success: false, error: "Ocurrió un error inesperado al procesar la factura: " + error.message };
  }
}
