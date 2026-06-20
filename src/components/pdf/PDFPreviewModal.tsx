"use client";

import React from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";

// Dynamic import with SSR disabled is REQUIRED for PDFViewer
const PDFViewer = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div style={{ padding: "2rem", textAlign: "center" }}>Cargando visor PDF...</div> }
);

import PurchaseOrderPDF from "./PurchaseOrderPDF";

interface PDFPreviewModalProps {
  order: any;
  items: { product: any; quantityNeeded: number }[];
  onClose: () => void;
}

export default function PDFPreviewModal({ order, items, onClose }: PDFPreviewModalProps) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "2rem"
    }}>
      <div style={{
        background: "white",
        width: "100%",
        height: "100%",
        maxWidth: "1200px",
        borderRadius: "8px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#f9fafb"
        }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#203562" }}>
            Vista Preliminar: Orden de Compra {order.supplier.name}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#666"
            }}
          >
            <X size={24} />
          </button>
        </div>
        
        <div style={{ flex: 1, backgroundColor: "#525659" }}>
          <PDFViewer width="100%" height="100%" style={{ border: "none" }}>
            <PurchaseOrderPDF order={order} items={items} />
          </PDFViewer>
        </div>
      </div>
    </div>
  );
}
