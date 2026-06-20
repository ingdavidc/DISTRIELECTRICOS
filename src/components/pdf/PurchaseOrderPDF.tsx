import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Colores corporativos
const COLORS = {
  primary: '#203562',
  secondary: '#ff6b00',
  text: '#333333',
  textMuted: '#666666',
  border: '#e5e7eb',
  background: '#f9fafb',
};

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    paddingBottom: 20,
  },
  logoContainer: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  logoSubtitle: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 4,
    fontWeight: 'bold',
  },
  companyInfo: {
    textAlign: 'right',
    color: COLORS.textMuted,
    fontSize: 9,
    lineHeight: 1.4,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  orderNumber: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: 'bold',
  },
  metaBlock: {
    marginBottom: 4,
  },
  metaLabel: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginRight: 5,
  },
  metaValue: {
    color: COLORS.text,
  },
  partiesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 20,
  },
  partyBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 15,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  partyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 5,
  },
  partyLine: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    padding: 8,
  },
  th: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    padding: 8,
    alignItems: 'center',
  },
  td: {
    fontSize: 9,
  },
  colSku: { width: '15%' },
  colDesc: { width: '40%' },
  colQty: { width: '10%', textAlign: 'center' },
  colUnit: { width: '10%', textAlign: 'center' },
  colPrice: { width: '12%', textAlign: 'right' },
  colTotal: { width: '13%', textAlign: 'right' },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 30,
  },
  totalsBox: {
    width: '40%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  totalRowFinal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  totalValue: {
    fontWeight: 'bold',
  },
  totalFinalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  totalFinalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  conditionsBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  conditionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
  },
  conditionText: {
    fontSize: 8,
    color: COLORS.textMuted,
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  signatureBox: {
    marginTop: 60,
    width: 200,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary,
    paddingTop: 5,
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.primary,
  }
});

// Helper for currency formatting
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
};

// Interfaz para los props
interface PurchaseOrderPDFProps {
  order: any;
  items: { product: any, quantityNeeded: number }[];
}

export default function PurchaseOrderPDF({ order, items }: PurchaseOrderPDFProps) {
  const currentDate = new Date().toLocaleDateString('es-CO');
  // Fecha de entrega solicitada: 5 días después de hoy por defecto
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString('es-CO');

  const subtotal = items.reduce((sum: any, item: any) => sum + (item.product.cost * item.quantityNeeded), 0);
  const taxes = 0; // Se asume IVA incluido en el costo para este ERP simplificado, o se puede calcular si hay campo de impuesto aplicable al costo.
  const total = subtotal + taxes;

  const orderIdNumber = order.id.split('-')[0].toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* 1. ENCABEZADO E IDENTIFICACIÓN */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoTitle}>DISTRIELECTRICOS</Text>
            <Text style={styles.logoSubtitle}>IDEAS CON ENERGÍA</Text>
          </View>
          <View style={styles.companyInfo}>
            <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>DISTRIELECTRICOS E&D S.A.S</Text>
            <Text>NIT: 900.123.456-7</Text>
            <Text>Calle Falsa 123, Bogotá D.C., Colombia</Text>
            <Text>Tel: +57 601 555 5555</Text>
            <Text>compras@distrielectricos.com</Text>
          </View>
        </View>

        {/* 3. DETALLES DE CONTROL Y 2. PROVEEDOR (En un bloque paralelo) */}
        <View style={styles.titleSection}>
          <View>
            <Text style={styles.documentTitle}>Orden de Compra</Text>
            <Text style={styles.orderNumber}>No. PO-{orderIdNumber}</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 2 }}>
              <Text style={styles.metaLabel}>Fecha de Emisión:</Text>
              <Text style={styles.metaValue}>{currentDate}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Text style={styles.metaLabel}>Fecha de Entrega Solicitada:</Text>
              <Text style={styles.metaValue}>{formattedDeliveryDate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.partiesContainer}>
          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>INFORMACIÓN DEL PROVEEDOR</Text>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Razón Social:</Text>
              <Text style={styles.metaValue}>{order.supplier.name}</Text>
            </View>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>NIT/RUT:</Text>
              <Text style={styles.metaValue}>{order.supplier.nit || 'No registrado'}</Text>
            </View>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Asesor/Contacto:</Text>
              <Text style={styles.metaValue}>{order.supplier.contactName || 'Ventas Corporativas'}</Text>
            </View>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Email:</Text>
              <Text style={styles.metaValue}>{order.supplier.email}</Text>
            </View>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Teléfono:</Text>
              <Text style={styles.metaValue}>{order.supplier.phone}</Text>
            </View>
          </View>

          <View style={styles.partyBox}>
            <Text style={styles.partyTitle}>FACTURAR Y ENVIAR A</Text>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Compañía:</Text>
              <Text style={styles.metaValue}>Distrielectricos E&D S.A.S</Text>
            </View>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Atención:</Text>
              <Text style={styles.metaValue}>Bodega Central - Recepción de Mercancía</Text>
            </View>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Dirección:</Text>
              <Text style={styles.metaValue}>Calle Falsa 123, Bodega 4</Text>
            </View>
            <View style={styles.partyLine}>
              <Text style={styles.metaLabel}>Ciudad:</Text>
              <Text style={styles.metaValue}>Bogotá D.C., Colombia</Text>
            </View>
          </View>
        </View>

        {/* 4. DETALLES DE LOS PRODUCTOS (Cuerpo) */}
        <View style={styles.table}>
          {/* Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colSku]}>CÓDIGO/SKU</Text>
            <Text style={[styles.th, styles.colDesc]}>DESCRIPCIÓN</Text>
            <Text style={[styles.th, styles.colQty]}>CANT</Text>
            <Text style={[styles.th, styles.colUnit]}>UNIDAD</Text>
            <Text style={[styles.th, styles.colPrice]}>PRECIO UNIT.</Text>
            <Text style={[styles.th, styles.colTotal]}>TOTAL</Text>
          </View>
          
          {/* Rows */}
          {items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, styles.colSku]}>{item.product.sku}</Text>
              <Text style={[styles.td, styles.colDesc]}>{item.product.name}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantityNeeded}</Text>
              <Text style={[styles.td, styles.colUnit]}>{item.product.unit || 'Und'}</Text>
              <Text style={[styles.td, styles.colPrice]}>{formatCurrency(item.product.cost)}</Text>
              <Text style={[styles.td, styles.colTotal]}>{formatCurrency(item.product.cost * item.quantityNeeded)}</Text>
            </View>
          ))}
        </View>

        {/* Totales */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalFinalLabel}>TOTAL ORDEN:</Text>
              <Text style={styles.totalFinalValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* Firma Autorizada */}
        <View style={styles.signatureBox}>
          <Text style={styles.signatureText}>Firma Autorizada y Sello</Text>
          <Text style={{ fontSize: 8, color: COLORS.textMuted, marginTop: 4 }}>Dpto. de Compras - Distrielectricos E&D</Text>
        </View>

        {/* 5. CONDICIONES DE ENVÍO Y PAGO */}
        <View style={styles.conditionsBox}>
          <Text style={styles.conditionTitle}>CONDICIONES DE ENVÍO Y PAGO</Text>
          <Text style={styles.conditionText}>
            1. Método de envío: Entregado en instalaciones del cliente (Bodega Central). El costo del flete debe ser asumido por el proveedor según acuerdos previos.{"\n"}
            2. Condiciones de pago: Crédito a 30 días a partir de la radicación de la factura electrónica.{"\n"}
            3. Términos de entrega: Se requiere la entrega completa de los ítems solicitados. No se aceptan entregas parciales sin autorización previa.{"\n"}
            4. Favor enviar la factura electrónica al correo electronica@distrielectricos.com haciendo referencia a este número de orden.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generado automáticamente por Distrielectricos ERP</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (
            `Página ${pageNumber} de ${totalPages}`
          )} fixed />
        </View>
        
      </Page>
    </Document>
  );
}
