"use client";

import { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle, AlertTriangle, Loader2, X, Bot, Sparkles } from "lucide-react";
import { getGeminiConfig } from "@/actions/ai-parser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { importAiData, AiImportData } from "@/actions/inventory";
import toast from "react-hot-toast";

export default function AiPdfModal({ 
  isOpen, 
  onClose,
  onSingleProductFill 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSingleProductFill?: (data: AiImportData["products"][0], supplierId?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<AiImportData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      toast.error("Por favor selecciona un archivo PDF.");
      return;
    }

    setFile(selected);
    setIsProcessing(true);
    setParsedData(null);

    try {
      // Validar tamaño máximo (Ej: 10MB)
      if (selected.size > 10 * 1024 * 1024) {
        toast.error("El archivo PDF no puede superar los 10 MB.");
        setFile(null);
        setIsProcessing(false);
        return;
      }

      // Convertir archivo a base64 nativamente (rápido y no congela la UI)
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(selected);
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
      });

      // Obtener llave API segura del servidor
      const configRes = await getGeminiConfig();
      if (!configRes.success || !configRes.key) {
        throw new Error("No se pudo obtener la llave de API o la sesión caducó.");
      }

      // Iniciar Gemini localmente (bypassa los límites de tiempo y peso de Vercel)
      const genAI = new GoogleGenerativeAI(configRes.key);
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

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
        "4. Si el PDF es un recibo escaneado o imagen, leelo igual y extrae lo mejor posible.",
        "5. MUY IMPORTANTE: Escapa correctamente cualquier comilla doble (\") dentro de los textos usando la barra invertida (\\\") para no romper la sintaxis del JSON."
      ].join("\\n");

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType: selected.type } }
        ]}],
        generationConfig: {
          responseMimeType: "application/json",
        }
      });

      const responseText = result.response.text();
      // Extraer solo el bloque JSON válido desde el primer '{' hasta el último '}'
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const cleanedJson = jsonMatch ? jsonMatch[0] : responseText;
      const parsedData = JSON.parse(cleanedJson);

      setParsedData(parsedData);
      toast.success("Factura procesada con éxito por la IA.");

    } catch (err: any) {
      console.error("Error AI local:", err);
      toast.error("Error al procesar: " + err.message);
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    
    // Si estamos en modo llenado de un solo producto (desde la ficha técnica)
    if (onSingleProductFill) {
      if (parsedData.products.length === 0) {
        toast.error("No se encontraron productos en la factura.");
        return;
      }
      // Llenamos con el primer producto
      onSingleProductFill(parsedData.products[0]);
      onClose();
      return;
    }

    // Modo Importación Masiva
    setIsProcessing(true);
    try {
      const res = await importAiData(parsedData);
      if (res.success) {
        toast.success("Importación masiva completada con éxito.");
        onClose();
        setParsedData(null);
        setFile(null);
      } else {
        toast.error(res.error || "Error al guardar en base de datos.");
      }
    } catch (err: any) {
      toast.error("Error al guardar: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setFile(null);
    setParsedData(null);
    onClose();
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "2rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "900px", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden", background: "#fff" }}>
        
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={24} /> 
            {onSingleProductFill ? "Autocompletar con IA" : "Importación Inteligente de Facturas"}
          </h2>
          <button type="button" onClick={closeModal} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={24} color="var(--color-text-muted)" />
          </button>
        </div>

        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {!file && !isProcessing && (
            <div 
              style={{ border: "2px dashed var(--color-primary)", borderRadius: "8px", padding: "3rem", textAlign: "center", cursor: "pointer", background: "rgba(37, 99, 235, 0.05)" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={48} color="var(--color-primary)" style={{ margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem" }}>Sube tu factura PDF</h3>
              <p style={{ color: "var(--color-text-muted)" }}>La Inteligencia Artificial extraerá los productos, cantidades, costos y el proveedor automáticamente.</p>
              <input type="file" accept="application/pdf" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
            </div>
          )}

          {isProcessing && (
            <div style={{ textAlign: "center", padding: "4rem 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <style>{`
                @keyframes botBounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-12px); }
                }
                @keyframes botGlow {
                  0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
                  70% { box-shadow: 0 0 0 20px rgba(37, 99, 235, 0); }
                  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
                }
              `}</style>
              
              <div style={{ position: "relative", marginBottom: "2rem", animation: "botBounce 2s ease-in-out infinite" }}>
                <div style={{ 
                  position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", 
                  width: "60px", height: "60px", background: "var(--color-primary)", opacity: 0.1, borderRadius: "50%",
                  animation: "botGlow 2s infinite"
                }} />
                <Bot size={80} color="var(--color-primary)" style={{ position: "relative", zIndex: 2 }} />
                <div style={{ position: "absolute", top: -10, right: -15, animation: "botBounce 1.5s ease-in-out infinite", animationDelay: "0.5s", zIndex: 3 }}>
                  <Sparkles size={32} color="#eab308" />
                </div>
              </div>
              
              <h3 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "0.5rem" }}>
                La Inteligencia Artificial está leyendo...
              </h3>
              <p style={{ color: "var(--color-text-muted)", maxWidth: "400px", margin: "0 auto" }}>
                Analizando el documento y extrayendo productos, cantidades, costos e impuestos. Por favor no cierres la ventana.
              </p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2rem", background: "rgba(37, 99, 235, 0.05)", padding: "0.75rem 1.5rem", borderRadius: "30px", fontSize: "0.95rem", fontWeight: 500 }}>
                <Loader2 size={18} className="spin" color="var(--color-primary)" />
                <span style={{ color: "var(--color-primary)" }}>Procesando en tiempo real</span>
              </div>
            </div>
          )}

          {parsedData && !isProcessing && (
            <div>
              <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "1rem", borderRadius: "8px", marginBottom: "1.5rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <CheckCircle size={24} color="var(--color-success)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontWeight: 700, color: "var(--color-success)" }}>Lectura Exitosa</h4>
                  <p style={{ fontSize: "0.9rem", marginTop: "0.25rem" }}>Revisa los datos extraídos antes de confirmar la importación.</p>
                </div>
              </div>

              {parsedData.supplier && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ fontWeight: 600, borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>Datos del Proveedor</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div><span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Razón Social</span><p style={{ fontWeight: 600 }}>{parsedData.supplier.name || "No detectado"}</p></div>
                    <div><span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>NIT/Identificación</span><p style={{ fontWeight: 600 }}>{parsedData.supplier.identification || "No detectado"}</p></div>
                  </div>
                </div>
              )}

              <h4 style={{ fontWeight: 600, borderBottom: "1px solid var(--color-border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                Productos Detectados ({parsedData.products.length})
              </h4>
              
              <div style={{ overflowX: "auto" }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Descripción</th>
                      <th>Cant.</th>
                      <th>Costo Unit.</th>
                      <th>IVA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.products.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.sku || "Generar"}</td>
                        <td>{p.name}</td>
                        <td>{p.quantity}</td>
                        <td>${p.cost?.toLocaleString('de-DE')}</td>
                        <td>{p.tax}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {onSingleProductFill && parsedData.products.length > 1 && (
                <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", color: "var(--color-warning)", alignItems: "center", background: "rgba(234, 179, 8, 0.1)", padding: "0.75rem", borderRadius: "8px" }}>
                  <AlertTriangle size={20} />
                  <span style={{ fontSize: "0.9rem" }}>Al autocompletar un solo producto, solo se usarán los datos del <b>primer</b> producto de la lista.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end", gap: "1rem", background: "var(--color-bg)" }}>
          <button type="button" className="btn btn-outline" onClick={closeModal} disabled={isProcessing}>
            Cancelar
          </button>
          {parsedData && !isProcessing && (
            <button type="button" className="btn btn-primary" onClick={handleConfirmImport}>
              {onSingleProductFill ? "Llenar Formulario" : "Importar y Guardar en BD"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
