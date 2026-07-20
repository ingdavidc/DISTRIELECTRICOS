import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { GoogleGenAI } from '@google/genai';

// GET: Verificación de Webhook por parte de Meta
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WA_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Fallo de verificación' }, { status: 403 });
}

// POST: Recepción de Mensajes de WhatsApp
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validar estructura de WhatsApp Cloud API
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' }, { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'no_messages' });
    }

    const message = messages[0];
    const senderPhone = message.from; // Número de quien envía

    // Si el mensaje tiene un documento o imagen
    if (message.type === 'document' || message.type === 'image') {
      const mediaId = message.type === 'document' ? message.document.id : message.image.id;
      
      // Enviar mensaje de "Procesando"
      await sendWhatsAppMessage(senderPhone, "⏳ Hemos recibido tu documento. Nuestra Inteligencia Artificial lo está analizando para extraer tus datos de facturación DIAN...");

      // 1. Obtener la URL del media desde Meta
      const metaToken = process.env.META_WA_TOKEN;
      const mediaUrlRes = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
        headers: { Authorization: `Bearer ${metaToken}` }
      });
      const mediaData = await mediaUrlRes.json();
      
      if (!mediaData.url) {
        throw new Error("No se pudo obtener la URL del archivo desde Meta");
      }

      // 2. Descargar el archivo binario
      const downloadRes = await fetch(mediaData.url, {
        headers: { Authorization: `Bearer ${metaToken}` }
      });
      const buffer = await downloadRes.arrayBuffer();
      const base64Data = Buffer.from(buffer).toString('base64');
      const mimeType = downloadRes.headers.get('content-type') || 'application/pdf';

      // 3. Procesar con Gemini 3.5 Flash
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
- address: Dirección física.
- city: Ciudad o Municipio.
- department: Departamento.
Solo retorna JSON, nada más.
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
        ]
      });

      const textOutput = response.text || "";
      const jsonStr = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(jsonStr);

      // 4. Buscar al cliente por número de teléfono
      // Limpiamos senderPhone para buscar similitudes o hacer match exacto
      const cleanPhone = senderPhone.replace(/\D/g, "");
      
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: { contains: cleanPhone } },
            { phone: senderPhone },
            // También buscamos por NIT si el teléfono no coincide pero el NIT sí
            { identification: data.identification }
          ]
        }
      });

      if (existingCustomer) {
        // Actualizar cliente existente
        await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            identification: data.identification || existingCustomer.identification,
            name: existingCustomer.name || data.name, // Preferimos el nombre existente si ya lo tenía, o el del RUT
            email: existingCustomer.email || data.email,
            address: existingCustomer.address || data.address,
            personType: data.personType,
            taxRegime: data.taxRegime,
            taxResponsibilities: data.taxResponsibilities,
            ciiuCode: data.ciiuCode,
            city: data.city,
            department: data.department
          }
        });
      } else {
        // Crear nuevo cliente
        await prisma.customer.create({
          data: {
            identification: data.identification || "SIN_NIT",
            name: data.name || "Cliente Nuevo",
            phone: senderPhone, // Usamos el de WhatsApp
            email: data.email,
            address: data.address,
            personType: data.personType,
            taxRegime: data.taxRegime,
            taxResponsibilities: data.taxResponsibilities,
            ciiuCode: data.ciiuCode,
            city: data.city,
            department: data.department
          }
        });
      }

      // Enviar confirmación final al cliente
      await sendWhatsAppMessage(senderPhone, "✨ ¡Magia pura! Tu RUT ha sido procesado exitosamente por nuestra IA y tus datos han sido actualizados. Ya podemos emitir tu Factura Electrónica.");

      return NextResponse.json({ status: 'success' });
    }

    return NextResponse.json({ status: 'ignored_type' });

  } catch (error) {
    console.error("Error en Webhook WhatsApp:", error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
