import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generateQuotePdf(
  clientName: string,
  expertName: string,
  items: { name: string; quantity: number; pvpPrice: number; sku?: string }[],
  totalPvp: number
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Helper to load image as base64 and get its aspect ratio
  const loadImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const img = new Image();
      img.src = base64;
      await new Promise((resolve) => { img.onload = resolve; });
      
      return { base64, ratio: img.width / img.height };
    } catch (e) {
      console.error("Error loading image", e);
      return null;
    }
  };

  const logoData = await loadImage("/logo.png");
  const dcLogoData = await loadImage("/dc-telematica.png");

  let currentY = 15;

  // Header (same as CAJA/PAGOS receipt)
  if (logoData) {
    const imgHeight = 16;
    const imgWidth = imgHeight * logoData.ratio;
    doc.addImage(logoData.base64, "PNG", (pageWidth - imgWidth) / 2, currentY, imgWidth, imgHeight);
    currentY += imgHeight + 8;
  } else {
    doc.setFontSize(20);
    doc.setTextColor(14, 165, 233);
    doc.text("DISTRIELECTRICOS E&D", pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  }

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("IDEAS CON ENERGÍA", pageWidth / 2, currentY, { align: "center" });
  currentY += 6;
  
  doc.setFontSize(9);
  doc.text("Teléfono: +57 313 223 9174", pageWidth / 2, currentY, { align: "center" });
  currentY += 5;
  doc.text("Web: www.distrielectricoseyd.com", pageWidth / 2, currentY, { align: "center" });
  currentY += 5;
  doc.text("Dirección: CALLE 25 # 12-55, Saravena - Arauca", pageWidth / 2, currentY, { align: "center" });
  currentY += 15;

  // Quote Info
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("COTIZACIÓN DE PRODUCTOS", 14, currentY);
  currentY += 10;

  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 14, currentY);
  currentY += 7;
  doc.text(`Cliente: ${clientName || "Consumidor Final"}`, 14, currentY);
  currentY += 7;
  doc.text(`Asesor Experto: ${expertName}`, 14, currentY);
  currentY += 8;

  // Table
  const tableColumn = ["CANT.", "PRODUCTO", "V. UNITARIO", "TOTAL"];
  const tableRows: string[][] = [];

  items.forEach(item => {
    const itemData = [
      item.quantity.toString(),
      item.name + (item.sku ? `\nREF: ${item.sku}` : ""),
      `$${item.pvpPrice.toLocaleString('de-DE')}`,
      `$${(item.pvpPrice * item.quantity).toLocaleString('de-DE')}`
    ];
    tableRows.push(itemData);
  });

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: currentY,
    theme: 'grid',
    headStyles: { fillColor: [14, 165, 233], textColor: 255 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY || currentY + 50;

  // Total
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("TOTAL A PAGAR:", 120, finalY + 15);
  
  doc.setFontSize(14);
  doc.setTextColor(14, 165, 233);
  doc.text(`$${totalPvp.toLocaleString('de-DE')}`, 160, finalY + 15);

  // Footer Notes
  let footerY = finalY + 30;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text("Los precios están sujetos a cambios sin previo aviso.", 14, footerY);
  footerY += 5;
  doc.text("Validez de la cotización: 5 días hábiles.", 14, footerY);
  footerY += 5;
  doc.text("Los precios de esta cotización solo aplican para pago de contado.", 14, footerY);
  footerY += 5;
  doc.text("Cotización generada a través de la red de Aliados Expertos de Distrielectricos EYD.", 14, footerY);
  
  // Powered By DC Telematica
  footerY += 20;
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text("Powered By", pageWidth / 2, footerY, { align: "center" });
  if (dcLogoData) {
    const dcHeight = 6;
    const dcWidth = dcHeight * dcLogoData.ratio;
    doc.addImage(dcLogoData.base64, "PNG", (pageWidth - dcWidth) / 2, footerY + 2, dcWidth, dcHeight);
  } else {
    doc.text("DC Telematica", pageWidth / 2, footerY + 5, { align: "center" });
  }

  // Save the PDF
  doc.save(`Cotizacion_${clientName.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
}
