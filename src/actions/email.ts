'use server';

import { Resend } from 'resend';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import PurchaseOrderPDF from '@/components/pdf/PurchaseOrderPDF';

const resend = new Resend(process.env.RESEND_API_KEY || 're_123456');

export async function sendPurchaseOrderEmail(finalOrder: any) {
  const supplierEmail = finalOrder.supplier.email;
  const supplierName = finalOrder.supplier.name;
  const orderDetails = finalOrder.items;

  // Generar el PDF
  let pdfBuffer: Buffer;
  try {
    const stream = await renderToStream(
      React.createElement(PurchaseOrderPDF, { order: finalOrder, items: orderDetails }) as any
    );
    
    // Convert stream to buffer
    const chunks: any[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    pdfBuffer = Buffer.concat(chunks);
  } catch (err) {
    console.error("Error generando PDF:", err);
    return { success: false, error: "Error generando PDF adjunto" };
  }

  // Simulador si no hay llave de Resend real
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === '[Pega-Aqui-Tu-LLave-Resend]') {
    console.log(`\n\n=== 📧 SIMULADOR DE CORREO ===`);
    console.log(`Para: ${supplierEmail}`);
    console.log(`Asunto: Nueva Orden de Compra - Distrielectricos E&D`);
    console.log(`Adjunto: OrdenDeCompra_${finalOrder.id}.pdf (${pdfBuffer.length} bytes)`);
    console.log(`=============================\n\n`);
    
    return { success: true, simulated: true };
  }

  try {
    const htmlContent = `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2 style="color: #203562;">Nueva Orden de Compra</h2>
        <p>Hola <strong>${supplierName}</strong>,</p>
        <p>Desde Distrielectricos E&D adjuntamos a este correo la Orden de Compra oficial en formato PDF.</p>
        <p>Por favor revisar el documento adjunto y confirmar recibido.</p>
        
        <p style="margin-top: 30px;">Quedamos atentos a la confirmación y fechas de entrega.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin-top: 40px;" />
        <p style="font-size: 12px; color: #888;">Este es un correo automático generado por el ERP de Distrielectricos E&D.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Distrielectricos ERP <onboarding@resend.dev>', // Correo de prueba de Resend
      to: [supplierEmail],
      subject: 'Nueva Orden de Compra Adjunta - Distrielectricos E&D',
      html: htmlContent,
      attachments: [
        {
          filename: `OrdenDeCompra_${finalOrder.id.split('-')[0].toUpperCase()}.pdf`,
          content: pdfBuffer,
        }
      ]
    });

    if (error) {
      console.error("Error enviando correo:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error inesperado en correo:", error);
    return { success: false, error };
  }
}
