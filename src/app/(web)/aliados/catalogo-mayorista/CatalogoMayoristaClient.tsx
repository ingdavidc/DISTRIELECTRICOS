"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, Trash2, CheckCircle, Upload, FileImage, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { searchProductsForExpert, createExpertWholesaleOrder } from "@/actions/expert-catalog";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import imageCompression from "browser-image-compression";

export default function CatalogoMayoristaClient({ userId, userName }: { userId: string, userName: string }) {
  const router = useRouter();
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cart/Order state
  const [cart, setCart] = useState<{product: any, quantity: number}[]>([]);
  
  // Checkout state
  const [deliveryType, setDeliveryType] = useState<"PICKUP" | "DELIVERY">("PICKUP");
  const [notes, setNotes] = useState("");
  
  // Payment Receipt state
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderCreated, setOrderCreated] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchProductsForExpert(searchTerm);
          setSearchResults(results);
        } catch (e) {
          toast.error("Error buscando productos");
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const exists = prev.find(i => i.product.id === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) {
          toast.error("Stock máximo alcanzado");
          return prev;
        }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success("Producto agregado", { position: "bottom-center" });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.product.id === id) {
          const newQ = i.quantity + delta;
          if (newQ > i.product.stock) {
            toast.error("Stock insuficiente");
            return i;
          }
          if (newQ < 1) return i;
          return { ...i, quantity: newQ };
        }
        return i;
      });
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.product.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.product.discountedPrice * item.quantity), 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return toast.error("El carrito está vacío");
    if (!receiptFile) return toast.error("Debes adjuntar un soporte de pago");

    setIsSubmitting(true);
    const tid = toast.loading("Subiendo soporte y procesando orden...");

    try {
      // 1. Upload receipt to Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) throw new Error("Configuración de almacenamiento incompleta");
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Compress if it's an image
      let fileToUpload: File | Blob = receiptFile;
      if (receiptFile.type.startsWith("image/")) {
        fileToUpload = await imageCompression(receiptFile, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true });
      }

      const fileName = `receipts/expert_${userId}_${Date.now()}_${receiptFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      
      const { error: uploadError } = await supabase.storage
        .from("orders")
        .upload(fileName, fileToUpload, { contentType: receiptFile.type });

      if (uploadError) throw new Error("Error subiendo el soporte de pago");

      const { data: { publicUrl } } = supabase.storage.from("orders").getPublicUrl(fileName);

      // 2. Create the Order
      const items = cart.map(i => ({ productId: i.product.id, quantity: i.quantity }));
      
      const res = await createExpertWholesaleOrder({
        items,
        deliveryType,
        notes,
        paymentReceiptUrl: publicUrl
      });

      if (res.success) {
        toast.success("¡Orden enviada a revisión exitosamente!", { id: tid });
        setOrderCreated(true);
        setCart([]);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Ocurrió un error al procesar la compra", { id: tid });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderCreated) {
    return (
      <div style={{ padding: "4rem 2rem", maxWidth: "800px", margin: "0 auto", textAlign: "center", minHeight: "80vh", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <CheckCircle size={80} color="var(--color-success)" style={{ margin: "0 auto 1.5rem auto" }} />
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "1rem" }}>¡Compra Registrada!</h1>
        <p style={{ fontSize: "1.1rem", color: "var(--color-text-muted)", marginBottom: "2rem" }}>
          Tu pago ha sido enviado y la orden está pendiente de aprobación en Caja.
          Una vez validada, pasará automáticamente a Bodega para su preparación.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link href="/aliados/dashboard" className="btn btn-outline" style={{ textDecoration: "none" }}>Volver al Panel</Link>
          <button onClick={() => setOrderCreated(false)} className="btn btn-secondary">Hacer nueva compra</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto", minHeight: "80vh" }}>
      
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <Link href="/aliados/dashboard" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>
          <ArrowLeft size={24} />
        </Link>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--color-primary)", margin: 0 }}>
          Catálogo Mayorista de Compras
        </h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem" }}>
        
        {/* Lado Izquierdo: Buscador y Resultados */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ padding: "1.5rem", background: "white", position: "sticky", top: "80px", zIndex: 10 }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={20} color="var(--color-secondary)" /> Buscar Productos
            </h2>
            <div style={{ position: "relative" }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Busca por SKU, nombre o categoría..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ fontSize: "1.1rem", padding: "1rem", paddingLeft: "3rem" }}
              />
              <Search size={20} color="var(--color-text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
              {isSearching && <span style={{ position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)", fontSize: "0.8rem", color: "var(--color-primary)" }}>Buscando...</span>}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {searchResults.length > 0 ? (
              searchResults.map(product => (
                <div key={product.id} className="card" style={{ display: "flex", gap: "1rem", padding: "1rem", alignItems: "center" }}>
                  <img src={product.imageUrl || "/placeholder.jpg"} alt={product.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", background: "#f0f0f0" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{product.sku}</div>
                    <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-primary)" }}>{product.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-secondary)" }}>
                        ${product.discountedPrice.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", textDecoration: "line-through" }}>
                        PVP: ${product.price.toLocaleString()}
                      </span>
                      <span style={{ fontSize: "0.75rem", background: "#e0f2fe", color: "#0369a1", padding: "0.2rem 0.5rem", borderRadius: "1rem", fontWeight: 700 }}>
                        -{product.expertDiscount || 5}% Dcto
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.8rem", color: product.stock > 0 ? "var(--color-success)" : "var(--color-danger)", fontWeight: 700, marginBottom: "0.5rem" }}>
                      Stock: {product.stock}
                    </div>
                    <button 
                      onClick={() => addToCart(product)}
                      disabled={product.stock < 1}
                      className={`btn ${product.stock < 1 ? 'btn-outline' : 'btn-secondary'}`} 
                      style={{ 
                        padding: "0.5rem 1rem", 
                        fontSize: "0.9rem", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.5rem",
                        background: product.stock < 1 ? "#e5e7eb" : undefined,
                        color: product.stock < 1 ? "#9ca3af" : undefined,
                        borderColor: product.stock < 1 ? "#e5e7eb" : undefined,
                        cursor: product.stock < 1 ? "not-allowed" : "pointer"
                      }}
                    >
                      {product.stock < 1 ? (
                        "Agotado"
                      ) : (
                        <>
                          <Plus size={16} /> Agregar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : searchTerm.length >= 2 && !isSearching ? (
              <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)" }}>
                No se encontraron productos para "{searchTerm}"
              </div>
            ) : searchTerm.length < 2 ? (
              <div className="card" style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-muted)", background: "transparent", border: "2px dashed var(--color-border)" }}>
                Escribe al menos 2 caracteres para buscar productos en el catálogo
              </div>
            ) : null}
          </div>
        </div>

        {/* Lado Derecho: Resumen de Orden y Soporte */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ padding: "1.5rem", position: "sticky", top: "80px", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 100px)" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-primary)" }}>
              <ShoppingCart size={20} /> Resumen de Compra
            </h2>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem", paddingRight: "0.5rem" }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  No has agregado productos
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} style={{ display: "flex", gap: "0.75rem", paddingBottom: "1rem", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", lineHeight: 1.2, marginBottom: "0.25rem" }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--color-secondary)" }}>
                        ${item.product.discountedPrice.toLocaleString()} x {item.quantity} = ${(item.product.discountedPrice * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", border: "1px solid var(--color-border)", borderRadius: "0.25rem", overflow: "hidden" }}>
                        <button type="button" onClick={() => updateQuantity(item.product.id, -1)} style={{ padding: "0.25rem", background: "var(--color-background)", border: "none", cursor: "pointer" }}><Minus size={14} /></button>
                        <span style={{ padding: "0 0.5rem", fontSize: "0.85rem", fontWeight: 600 }}>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.product.id, 1)} style={{ padding: "0.25rem", background: "var(--color-background)", border: "none", cursor: "pointer" }}><Plus size={14} /></button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(item.product.id)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <Trash2 size={12} /> Quitar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "2px dashed var(--color-border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.25rem", fontWeight: 800, color: "var(--color-primary)", marginBottom: "1.5rem" }}>
                <span>Total a Pagar:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>

              {cart.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem", display: "block" }}>
                      Método de Entrega
                    </label>
                    <select className="input" value={deliveryType} onChange={e => setDeliveryType(e.target.value as any)}>
                      <option value="PICKUP">Recoger en Tienda</option>
                      <option value="DELIVERY">Envío a Domicilio</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem", display: "block" }}>
                      Soporte de Pago (Transferencia)
                    </label>
                    <label style={{ 
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
                      padding: "1.5rem", border: "2px dashed var(--color-border)", borderRadius: "0.5rem", 
                      background: receiptFile ? "#e0f2fe" : "var(--color-background)", cursor: "pointer",
                      transition: "all 0.2s"
                    }}>
                      <input type="file" style={{ display: "none" }} accept="image/*,.pdf" onChange={e => e.target.files && setReceiptFile(e.target.files[0])} />
                      {receiptFile ? (
                        <>
                          <FileImage size={24} color="var(--color-secondary)" style={{ marginBottom: "0.5rem" }} />
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", textAlign: "center", wordBreak: "break-all" }}>
                            {receiptFile.name}
                          </span>
                        </>
                      ) : (
                        <>
                          <Upload size={24} color="var(--color-text-muted)" style={{ marginBottom: "0.5rem" }} />
                          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
                            Clic para subir imagen o PDF
                          </span>
                        </>
                      )}
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.5rem", display: "block" }}>
                      Notas adicionales (Opcional)
                    </label>
                    <textarea 
                      className="input" 
                      placeholder="Instrucciones de entrega, etc..." 
                      rows={2}
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    ></textarea>
                  </div>

                  <button 
                    onClick={handleSubmitOrder}
                    disabled={isSubmitting || !receiptFile}
                    className="btn btn-primary" 
                    style={{ padding: "1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", width: "100%", marginTop: "0.5rem" }}
                  >
                    {isSubmitting ? "Procesando..." : (
                      <>
                        <CheckCircle size={20} /> Enviar Orden y Pago
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
