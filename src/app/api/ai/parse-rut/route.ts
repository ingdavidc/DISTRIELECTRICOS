import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    // Proteger endpoint
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;

    if (!file && !url) {
      return NextResponse.json({ error: "No file or url provided" }, { status: 400 });
    }

    let base64Data = "";
    let mimeType = "application/pdf";

    if (file) {
      const buffer = await file.arrayBuffer();
      base64Data = Buffer.from(buffer).toString("base64");
      mimeType = file.type;
    } else if (url) {
      const fetchRes = await fetch(url);
      const buffer = await fetchRes.arrayBuffer();
      base64Data = Buffer.from(buffer).toString("base64");
      mimeType = fetchRes.headers.get("content-type") || "application/pdf";
    }

    // Inicializar cliente de Google GenAI (toma automáticamente GEMINI_API_KEY)
    const ai = new GoogleGenAI({});

    const prompt = `
Analiza este documento que es un RUT (Registro Único Tributario) de Colombia o un documento equivalente.
Extrae la siguiente información en formato JSON estricto. Si no encuentras algún dato, déjalo como cadena vacía "".
- identification: El NIT (sin dígito de verificación si tiene guión, o como aparezca). 
- name: Nombres y apellidos, o Razón Social completa.
- personType: "Natural" o "Juridica".
- taxRegime: El régimen tributario o tipo de contribuyente (ej. "Responsable de IVA" o "No Responsable de IVA").
- taxResponsibilities: Códigos de responsabilidades (ej. "O-13", "O-47", "O-48", etc.). Une varios con comas.
- ciiuCode: Código de la actividad económica principal (solo los números, ej "4659").
- email: Correo electrónico.
- phone: Número de teléfono.
- address: Dirección física.
- city: Ciudad o Municipio.
- department: Departamento.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
      }
    });

    const textResult = response.text;
    if (!textResult) {
      throw new Error("Empty response from AI");
    }

    const parsedData = JSON.parse(textResult);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error parsing RUT:", error);
    return NextResponse.json(
      { success: false, error: "Error analizando el documento: " + error.message },
      { status: 500 }
    );
  }
}
