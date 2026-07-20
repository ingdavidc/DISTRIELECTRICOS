import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function generateQuotePdf(
  clientName: string,
  expertName: string,
  items: { name: string; quantity: number; pvpPrice: number; sku?: string }[],
  totalPvp: number
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(14, 165, 233); // Primary color
  doc.text("DISTRIELECTRICOS EYD", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Soluciones Eléctricas e Iluminación", 14, 30);
  doc.text("Nit: 901.XXX.XXX-X", 14, 35);
  doc.text("Teléfono: +57 (XXX) XXX-XXXX", 14, 40);

  // Quote Info
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("COTIZACIÓN DE PRODUCTOS", 14, 55);

  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, 65);
  doc.text(`Cliente: ${clientName || "Consumidor Final"}`, 14, 72);
  doc.text(`Asesor Experto: ${expertName}`, 14, 79);

  // Table
  const tableColumn = ["SKU / REF", "DESCRIPCIÓN", "CANTIDAD", "V. UNITARIO", "TOTAL"];
  const tableRows: string[][] = [];

  items.forEach(item => {
    const itemData = [
      item.sku || "N/A",
      item.name,
      item.quantity.toString(),
      `$${item.pvpPrice.toLocaleString('de-DE')}`,
      `$${(item.pvpPrice * item.quantity).toLocaleString('de-DE')}`
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 85,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || 85;

  // Total
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL A PAGAR:", 120, finalY + 15);
  
  doc.setFontSize(14);
  doc.setTextColor(14, 165, 233);
  doc.text(`$${totalPvp.toLocaleString('de-DE')}`, 160, finalY + 15);

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Los precios están sujetos a cambios sin previo aviso.", 14, finalY + 30);
  doc.text("Validez de la cotización: 5 días hábiles.", 14, finalY + 35);
  doc.text("Cotización generada a través de la red de Aliados Expertos de Distrielectricos EYD.", 14, finalY + 40);

  // Save the PDF
  doc.save(`Cotizacion_${clientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}
