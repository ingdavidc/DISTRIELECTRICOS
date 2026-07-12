"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Search, Filter, Loader2, X, Save, Box, DollarSign, Truck, Image as ImageIcon, Sparkles, Barcode, Printer, RefreshCw } from "lucide-react";
import { getInventoryProducts, getCategories, createProduct, updateProduct, deleteProduct, createCategory, deleteCategory, ProductInputData } from "@/actions/inventory";
import { getSuppliers } from "@/actions/purchases";
import AiPdfModal from "@/components/admin/AiPdfModal";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { Trash2, Edit } from "lucide-react";
import imageCompression from "browser-image-compression";
import { NumericFormat } from "react-number-format";

import { Product } from "@prisma/client";
type Supplier = Awaited<ReturnType<typeof getSuppliers>>[0];
type Category = Awaited<ReturnType<typeof getCategories>>[0];

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiFillMode, setAiFillMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Check if adding these files would exceed 5 images
    if ((formData.imageUrls?.length || 0) + files.length > 5) {
      toast.error("Máximo 5 imágenes por producto");
      return;
    }

    try {
      setIsUploadingImage(true);
      const tid = toast.loading(`Optimizando y subiendo ${files.length} imagen(es)...`);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) throw new Error("Supabase no configurado");
      const supabase = createClient(supabaseUrl, supabaseKey);

      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Comprimir
        const options = {
          maxSizeMB: 0.1, // Max 100KB
          maxWidthOrHeight: 800,
          useWebWorker: true,
          fileType: "image/webp" as string,
        };
        const compressedFile = await imageCompression(file, options);
  
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, "_")}.webp`;
        
        const { error } = await supabase.storage
          .from("products")
          .upload(fileName, compressedFile, { contentType: "image/webp", upsert: true });
  
        if (error) throw error;
  
        const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName);
        newUrls.push(publicUrl);
      }

      setFormData(prev => {
        const updatedUrls = [...(prev.imageUrls || []), ...newUrls];
        return { 
          ...prev, 
          imageUrls: updatedUrls,
          // Mantener la primera imagen como imageUrl principal para retrocompatibilidad
          imageUrl: prev.imageUrl || updatedUrls[0] 
        };
      });
      toast.success("Imágenes subidas con éxito", { id: tid });
    } catch (error: any) {
      console.error(error);
      toast.error("Error al subir: " + (error.message || "Revisa las políticas de Supabase"), { duration: 5000 });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData(prev => {
      const newUrls = (prev.imageUrls || []).filter((_, index) => index !== indexToRemove);
      return {
        ...prev,
        imageUrls: newUrls,
        imageUrl: newUrls.length > 0 ? newUrls[0] : ""
      };
    });
  };

  const initialProductState: ProductInputData = {
    name: "", sku: "", commercialName: "", description: "", features: "", brand: "", categoryId: "",
    unit: "Und", stock: 0, minStockLimit: 10, maxStockLimit: 100, location: "",
    cost: 0, profitMargin: 30, freqClientDiscount: 5, volumeDiscount: 10, corporateDiscount: 15, tax: 19, price: 0,
    supplierId: "", altSupplierId: "", imageUrl: "", imageUrls: [], technicalSheetUrl: ""
  };
  
  const [formData, setFormData] = useState<ProductInputData>(initialProductState);
  const [initialFormData, setInitialFormData] = useState<ProductInputData>(initialProductState);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, sups, cats] = await Promise.all([getInventoryProducts(), getSuppliers(), getCategories()]);
      
      if (prods && (prods as any).error) {
        throw new Error((prods as any).error);
      }

      setProducts(prods as any[]);
      setSuppliers(sups);
      setCategories(cats);
    } catch (error: any) {
      console.error("loadData error:", error);
      toast.error(`Error al cargar datos: ${error.message || "Fallo de conexión"}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Setup Supabase Realtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const channel = supabase
        .channel('inventory-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'Order' },
          (payload) => {
            toast.success("🚨 ¡Nueva venta registrada en el POS!", {
              duration: 5000, icon: '🛎️', style: { background: 'var(--color-primary)', color: '#fff', fontWeight: 'bold' }
            });
            loadData();
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  // Auto-calculate PVP based on cost, margin and tax
  useEffect(() => {
    const cost = Number(formData.cost) || 0;
    const margin = Number(formData.profitMargin) || 0;
    const tax = Number(formData.tax) || 0;
    
    const subtotal = cost * (1 + (margin / 100));
    const finalPrice = subtotal * (1 + (tax / 100));
    
    setFormData(prev => ({ ...prev, price: Math.ceil(finalPrice / 100) * 100 }));
  }, [formData.cost, formData.profitMargin, formData.tax]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSavingCategory(true);
    const tid = toast.loading("Creando categoría...");
    try {
      const res = await createCategory(newCategoryName);
      if (res.error) throw new Error(res.error);
      toast.success("Categoría creada", { id: tid });
      setNewCategoryName("");
      const cats = await getCategories();
      setCategories(cats);
    } catch (error: any) {
      toast.error(error.message, { id: tid });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    const tid = toast.loading("Eliminando...");
    try {
      const res = await deleteCategory(id);
      if (res.error) throw new Error(res.error);
      toast.success("Categoría eliminada", { id: tid });
      setCategories(categories.filter(c => c.id !== id));
    } catch (error: any) {
      toast.error(error.message, { id: tid });
    }
  };

  const handleCloseModal = () => {
    const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    if (isDirty) {
      if (!confirm("Tienes cambios sin guardar. ¿Estás seguro que deseas cerrar?")) {
        return;
      }
    }
    setIsModalOpen(false);
  };

  const handleCloseModalRef = useRef(handleCloseModal);
  useEffect(() => {
    handleCloseModalRef.current = handleCloseModal;
  }, [handleCloseModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && document.querySelector(".modal-overlay")) {
        handleCloseModalRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.categoryId) {
      toast.error("Llena los campos obligatorios en la pestaña 1");
      setActiveTab(1);
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Guardando producto...");
    
    let result;
    if (editingProductId) {
      result = await updateProduct(editingProductId, formData);
    } else {
      result = await createProduct(formData);
    }

    if (result.success) {
      toast.success(editingProductId ? "Producto actualizado" : "Producto creado", { id: toastId });
      setIsModalOpen(false);
      setFormData(initialProductState);
      setEditingProductId(null);
      setActiveTab(1);
      await loadData();
    } else {
      toast.error(result.error || "Error al guardar", { id: toastId });
    }
    setIsSaving(false);
  };

  const handleGenerateSKU = () => {
    const randomSKU = "DE-" + Math.floor(100000 + Math.random() * 900000).toString();
    setFormData(prev => ({ ...prev, sku: randomSKU }));
  };

  const handlePrintBarcode = (sku: string, name: string) => {
    if (!sku) {
      toast.error("Primero ingresa o genera un SKU/Código");
      return;
    }
    const printWindow = window.open('', '_blank', 'width=400,height=300');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Código de Barras</title>
          <style>
            @page { size: auto; margin: 0mm; }
            body { 
              margin: 0; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              font-family: sans-serif;
              text-align: center;
              width: 100%;
              height: 100vh;
              background: white;
            }
            .logo { height: 20px; object-fit: contain; margin-bottom: 2px; }
            .name { font-size: 12px; font-weight: bold; margin-bottom: 2px; max-width: 90%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <img src="${window.location.origin}/logo.png" class="logo" />
          <div class="name">${name}</div>
          <svg id="barcode"></svg>
          <script>
            window.onload = function() {
              JsBarcode("#barcode", "${sku}", {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 40,
                displayValue: true,
                fontSize: 14,
                margin: 2
              });
              setTimeout(() => {
                window.print();
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEditClick = (prod: any) => {
    setEditingProductId(prod.id);
    const updatedFormData: ProductInputData = {
      name: prod.name, sku: prod.sku, commercialName: prod.commercialName || "", description: prod.description || "", features: prod.features || "", brand: prod.brand || "", categoryId: prod.categoryId,
      unit: prod.unit, stock: prod.stock, minStockLimit: prod.minStockLimit, maxStockLimit: prod.maxStockLimit || 100, location: prod.location || "",
      cost: prod.cost, profitMargin: prod.profitMargin, freqClientDiscount: prod.freqClientDiscount || 5, volumeDiscount: prod.volumeDiscount || 10, corporateDiscount: prod.corporateDiscount || 15, tax: prod.tax, price: prod.price,
      supplierId: prod.supplierId || "", altSupplierId: prod.altSupplierId || "", imageUrl: prod.imageUrl || "", imageUrls: prod.imageUrls || [], technicalSheetUrl: prod.technicalSheetUrl || ""
    };
    setFormData(updatedFormData);
    setInitialFormData(updatedFormData);
    setActiveTab(1);
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar el producto "${name}"? Esta acción no se puede deshacer.`)) {
      const toastId = toast.loading("Eliminando producto...");
      const result = await deleteProduct(id);
      if (result.success) {
        toast.success("Producto eliminado", { id: toastId });
        await loadData();
      } else {
        toast.error(result.error || "Error al eliminar", { id: toastId });
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventario y Abastecimiento</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", maxWidth: "600px", marginTop: "0.5rem" }}>
            Gestiona stock, ficha técnica y configura compras automáticas.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-outline" style={{ borderColor: "var(--color-secondary)", color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={() => { setAiFillMode(false); setIsAiModalOpen(true); }}>
            <Sparkles size={18} />
            Importar PDF con IA
          </button>
          <button className="btn btn-outline" onClick={() => setIsCategoryModalOpen(true)}>
            Gestionar Categorías
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingProductId(null); setFormData(initialProductState); setInitialFormData(initialProductState); setIsModalOpen(true); }}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "0" }}>
        <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", borderBottom: "1px solid var(--color-border)" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input 
              type="text" 
              placeholder="Buscar por SKU, nombre o marca..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input" 
              style={{ paddingLeft: "35px" }}
            />
          </div>
          <button className="btn btn-outline" onClick={loadData}>Recargar</button>
        </div>

        <div className="data-table-container" style={{ border: "none", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Producto / Marca</th>
                <th>Costo</th>
                <th>PVP</th>
                <th>Stock / Medida</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                    <Loader2 className="animate-spin" size={30} color="var(--color-primary)" style={{ margin: "0 auto" }} />
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod: any) => {
                  const currentStock = prod.stock;
                  const limit = prod.minStockLimit || 10;
                  
                  let stockColor = "inherit";
                  let statusBadge = null;

                  if (currentStock === 0) {
                    stockColor = "var(--color-danger)";
                    statusBadge = <div className="badge badge-danger" style={{ display: "inline-block", marginTop: "0.25rem" }}>Sin Existencias</div>;
                  } else if (currentStock <= limit) {
                    stockColor = "var(--color-warning)";
                    statusBadge = <div className="badge badge-warning" style={{ display: "inline-block", marginTop: "0.25rem" }}>Stock Bajo</div>;
                  } else {
                    stockColor = "var(--color-success)";
                    statusBadge = <div className="badge badge-success" style={{ display: "inline-block", marginTop: "0.25rem" }}>Normal</div>;
                  }

                  return (
                    <tr key={prod.id}>
                      <td style={{ fontWeight: 600, color: "var(--color-primary)" }}>{prod.sku}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{prod.name}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{prod.brand || 'Sin marca'} | {prod.category?.name}</div>
                      </td>
                      <td style={{ color: "var(--color-text-muted)" }}>${prod.cost?.toLocaleString('de-DE') || 0}</td>
                      <td style={{ fontWeight: 700, color: "var(--color-secondary)" }}>${prod.price?.toLocaleString('de-DE')}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontWeight: 700, fontSize: "1.1rem", color: stockColor }}>
                            {currentStock}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{prod.unit}</span>
                        </div>
                        {statusBadge}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button 
                            onClick={() => handlePrintBarcode(prod.sku, prod.name)}
                            style={{ color: "var(--color-text-muted)", padding: "0.5rem", cursor: "pointer", background: "transparent", border: "none" }}
                            title="Imprimir Código de Barras"
                          >
                            <Printer size={18} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(prod)}
                            style={{ color: "var(--color-secondary)", padding: "0.5rem", cursor: "pointer", background: "transparent", border: "none" }}
                            title="Editar Producto"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(prod.id, prod.name)}
                            style={{ color: "var(--color-danger)", padding: "0.5rem", cursor: "pointer", background: "transparent", border: "none" }}
                            title="Eliminar Producto"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL GESTION DE CATEGORIAS */}
      {isCategoryModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "2rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "500px", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", padding: "1.5rem", background: "var(--color-background)" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)" }}>Gestionar Categorías</h2>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={24} color="var(--color-text-muted)" />
              </button>
            </div>
            <div style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
              <form onSubmit={handleCreateCategory} style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
                <input type="text" className="input" placeholder="Nueva categoría..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
                <button type="submit" className="btn btn-primary" disabled={isSavingCategory} style={{ whiteSpace: "nowrap" }}>
                  {isSavingCategory ? "Creando..." : "Crear"}
                </button>
              </form>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {categories.length === 0 ? (
                  <div style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "1rem" }}>No hay categorías.</div>
                ) : (
                  categories.map(cat => (
                    <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                      <span style={{ fontWeight: 600 }}>{cat.name}</span>
                      <button onClick={() => handleDeleteCategory(cat.id)} style={{ color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer" }} title="Eliminar Categoría">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AVANZADO DE CREACIÓN/EDICIÓN DE PRODUCTO */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "2rem" }}>
          <div className="card" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>
            
            {/* Header del Modal */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", padding: "1.5rem", background: "var(--color-background)" }}>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Box size={24} /> {editingProductId ? "Editar Producto" : "Ficha Técnica del Producto"}
              </h2>
              <button type="button" onClick={handleCloseModal} style={{ background: "transparent", border: "none", cursor: "pointer" }}>
                <X size={24} color="var(--color-text-muted)" />
              </button>
            </div>

            {/* Pestañas (Tabs) */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", background: "white" }}>
              {[
                { id: 1, label: "1. Identificación" },
                { id: 2, label: "2. Inventario" },
                { id: 3, label: "3. Costos y Precios" },
                { id: 4, label: "4. Proveedores" },
                { id: 5, label: "5. IA" }
              ].map((tab: any) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1, padding: "1rem", background: "transparent", border: "none", cursor: "pointer",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    color: activeTab === tab.id ? (tab.id === 5 ? "var(--color-secondary)" : "var(--color-primary)") : "var(--color-text-muted)",
                    borderBottom: activeTab === tab.id ? `3px solid ${tab.id === 5 ? "var(--color-secondary)" : "var(--color-primary)"}` : "3px solid transparent",
                    transition: "all 0.2s"
                  }}
                >
                  {tab.id === 5 ? <><Sparkles size={16} style={{ display: "inline", marginRight: "6px", verticalAlign: "text-bottom" }}/> IA</> : tab.label}
                </button>
              ))}
            </div>

            {/* Contenido del Formulario */}
            <form onSubmit={handleSaveSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "2rem", background: "white" }}>
                
                {/* TAB 1: IDENTIFICACIÓN */}
                <div style={{ display: activeTab === 1 ? 'block' : 'none' }}>
                  <h3 style={{ marginBottom: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Información General y de Identificación</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Nombre Comercial *</label>
                      <input required type="text" className="input" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ej: Breaker 20A Residencial" />
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Características o Descripción Adicional</label>
                      <textarea className="input" style={{ minHeight: "80px", resize: "vertical" }} value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} placeholder="Ej: 1 polo, 120/240V, Montaje enchufable..." />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>URL Ficha Técnica (PDF/Web)</label>
                      <input type="url" className="input" value={formData.technicalSheetUrl} onChange={(e) => setFormData({...formData, technicalSheetUrl: e.target.value})} placeholder="Ej: https://docs.schneider.com/breaker-20a.pdf" />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>SKU o Código de Barras *</span>
                        <button type="button" onClick={() => handlePrintBarcode(formData.sku, formData.name || "Nuevo Producto")} style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--color-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
                          <Printer size={14} /> Imprimir
                        </button>
                      </label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input required type="text" className="input" style={{ flex: 1 }} value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="Ej: PRO-BRK-20A" />
                        <button type="button" className="btn btn-outline" title="Generar Código Aleatorio" onClick={handleGenerateSKU} style={{ padding: "0 0.75rem" }}>
                          <RefreshCw size={18} />
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Categoría / Familia *</label>
                      <select required className="input" value={formData.categoryId} onChange={(e) => setFormData({...formData, categoryId: e.target.value})}>
                        <option value="">Seleccione Categoría...</option>
                        {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Marca Comercial</label>
                      <input type="text" className="input" value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} placeholder="Ej: Schneider, Legrand..." />
                    </div>
                  </div>
                </div>

                {/* TAB 2: INVENTARIO */}
                <div style={{ display: activeTab === 2 ? 'block' : 'none' }}>
                  <h3 style={{ marginBottom: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Control de Inventario y Medidas</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Stock en Bodega *</label>
                      <input required type="number" min="0" className="input" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} disabled={!!editingProductId} title={editingProductId ? "El stock debe actualizarse a través de transacciones" : ""} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Unidad de Medida / Presentación</label>
                      <select className="input" value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})}>
                        <option value="Und">Unidad (Und)</option>
                        <option value="Mtr">Metro (Mtr)</option>
                        <option value="Rollo">Rollo</option>
                        <option value="Caja">Caja</option>
                        <option value="Par">Par</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Límite Mínimo (Alarma Compras)</label>
                      <input type="number" min="0" className="input" value={formData.minStockLimit} onChange={(e) => setFormData({...formData, minStockLimit: parseInt(e.target.value) || 0})} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Límite Máximo (Tope Bodega)</label>
                      <input type="number" min="0" className="input" value={formData.maxStockLimit} onChange={(e) => setFormData({...formData, maxStockLimit: parseInt(e.target.value) || 0})} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Ubicación Física en Bodega</label>
                      <input type="text" className="input" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Ej: Pasillo 4 - Estante B" />
                    </div>
                  </div>
                </div>

                {/* TAB 3: COSTOS */}
                <div style={{ display: activeTab === 3 ? 'block' : 'none' }}>
                  <h3 style={{ marginBottom: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Costos, Impuestos y Precio de Venta</h3>
                  
                  <div style={{ background: "var(--color-light-gray)", padding: "1.5rem", borderRadius: "var(--radius-lg)", marginBottom: "1.5rem", display: "flex", gap: "2rem", alignItems: "center" }}>
                    <DollarSign size={40} color="var(--color-secondary)" />
                    <div>
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Precio de Venta al Público (PVP) Sugerido</p>
                      <h2 style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-primary)" }}>${formData.price.toLocaleString('de-DE')}</h2>
                      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Calculado automáticamente según costo, utilidad e impuestos.</p>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Costo de Adquisición (Sin IVA)</label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}>$</span>
                        <NumericFormat 
                          className="input" 
                          style={{ paddingLeft: "30px" }} 
                          value={formData.cost} 
                          thousandSeparator="." 
                          decimalSeparator="," 
                          onValueChange={(values) => setFormData({...formData, cost: values.floatValue || 0})} 
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Porcentaje de Utilidad Esperada</label>
                      <div style={{ position: "relative" }}>
                        <input type="number" min="0" max="100" className="input" value={formData.profitMargin} onChange={(e) => setFormData({...formData, profitMargin: parseFloat(e.target.value) || 0})} />
                        <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Impuestos (IVA)</label>
                      <div style={{ position: "relative" }}>
                        <input type="number" min="0" max="100" className="input" value={formData.tax} onChange={(e) => setFormData({...formData, tax: parseFloat(e.target.value) || 0})} />
                        <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fila de Descuentos (Multi-tier Pricing) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Dcto. Cliente Frecuente</label>
                      <div style={{ position: "relative" }}>
                        <input type="number" min="0" max="100" className="input" value={formData.freqClientDiscount} onChange={(e) => setFormData({...formData, freqClientDiscount: parseFloat(e.target.value) || 0})} />
                        <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Dcto. Volumen</label>
                      <div style={{ position: "relative" }}>
                        <input type="number" min="0" max="100" className="input" value={formData.volumeDiscount} onChange={(e) => setFormData({...formData, volumeDiscount: parseFloat(e.target.value) || 0})} />
                        <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Dcto. Corporativo</label>
                      <div style={{ position: "relative" }}>
                        <input type="number" min="0" max="100" className="input" value={formData.corporateDiscount} onChange={(e) => setFormData({...formData, corporateDiscount: parseFloat(e.target.value) || 0})} />
                        <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginTop: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Ajuste Manual de PVP</label>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }}>$</span>
                        <NumericFormat 
                          className="input" 
                          style={{ paddingLeft: "30px" }} 
                          value={formData.price} 
                          thousandSeparator="." 
                          decimalSeparator="," 
                          onValueChange={(values) => setFormData({...formData, price: values.floatValue || 0})} 
                        />
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Puedes sobreescribir el precio sugerido aquí.</span>
                    </div>
                  </div>
                </div>

                {/* TAB 4: PROVEEDORES E IMAGEN */}
                <div style={{ display: activeTab === 4 ? 'block' : 'none' }}>
                  <h3 style={{ marginBottom: "1.5rem", color: "var(--color-text-muted)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px" }}>Proveedores y Logística</h3>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Proveedor Principal (Auto-Compra)</label>
                      <select className="input" value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})}>
                        <option value="">Seleccione Proveedor...</option>
                        {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Proveedor Alternativo</label>
                      <select className="input" value={formData.altSupplierId} onChange={(e) => setFormData({...formData, altSupplierId: e.target.value})}>
                        <option value="">Ninguno / Opcional</option>
                        {suppliers.filter(s => s.id !== formData.supplierId).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <ImageIcon size={18} /> Imágenes del Producto (Máximo 5)
                      </label>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
                        {formData.imageUrls && formData.imageUrls.length > 0 ? (
                          formData.imageUrls.map((url, idx) => (
                            <div key={idx} style={{ position: "relative", width: "100px", height: "100px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Preview ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <button type="button" onClick={() => handleRemoveImage(idx)} style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(255,0,0,0.8)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px" }}>
                                <X size={14} />
                              </button>
                            </div>
                          ))
                        ) : formData.imageUrl ? (
                          <div style={{ position: "relative", width: "100px", height: "100px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)", flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          </div>
                        ) : null}
                        
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "250px" }}>
                          {isMobile ? (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <label className="btn btn-outline" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", cursor: isUploadingImage ? "not-allowed" : "pointer", opacity: isUploadingImage ? 0.6 : 1, padding: "0.5rem", fontSize: "0.85rem" }}>
                                📷 Cámara
                                <input type="file" accept="image/*" multiple capture="environment" onChange={handleImageUpload} disabled={isUploadingImage} style={{ display: "none" }} />
                              </label>
                              <label className="btn btn-outline" style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", cursor: isUploadingImage ? "not-allowed" : "pointer", opacity: isUploadingImage ? 0.6 : 1, padding: "0.5rem", fontSize: "0.85rem" }}>
                                🖼️ Galería
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={isUploadingImage} style={{ display: "none" }} />
                              </label>
                            </div>
                          ) : (
                            <input 
                              type="file" 
                              accept="image/*" 
                              multiple
                              onChange={handleImageUpload} 
                              disabled={isUploadingImage}
                              className="input" 
                              style={{ padding: "0.5rem" }}
                            />
                          )}
                          <input 
                            type="text" 
                            className="input" 
                            value={formData.imageUrl} 
                            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                            placeholder="O pega la URL de la imagen directamente..." 
                          />
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                            * Las imágenes se comprimirán automáticamente a WebP (&lt;100KB) antes de subirse.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* TAB 5: IA */}
                {activeTab === 5 && (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    <Sparkles size={48} color="var(--color-secondary)" style={{ margin: "0 auto 1rem" }} />
                    <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem" }}>Auto-llenado Inteligente</h3>
                    <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>¿Tienes la factura PDF de este producto? Súbela y la Inteligencia Artificial llenará la Ficha Técnica por ti (Nombres, Costos e Impuestos).</p>
                    <button type="button" className="btn btn-outline" style={{ borderColor: "var(--color-secondary)", color: "var(--color-secondary)" }} onClick={() => { setAiFillMode(true); setIsAiModalOpen(true); }}>
                      Abrir Asistente PDF
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ padding: "1.5rem", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-background)" }}>
                <div>
                  {activeTab > 1 && (
                    <button type="button" className="btn btn-outline" onClick={() => setActiveTab(activeTab - 1)}>Anterior</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="button" id="close-modal-btn" className="btn btn-outline" onClick={handleCloseModal}>Cancelar</button>
                  
                  {activeTab < 5 ? (
                    <button type="button" className="btn btn-primary" onClick={() => setActiveTab(activeTab + 1)}>Siguiente Pestaña</button>
                  ) : (
                    <button type="submit" className="btn btn-primary" disabled={isSaving}>
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                      {editingProductId ? "Guardar Cambios" : "Guardar Producto"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE IA */}
      <AiPdfModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        onSingleProductFill={aiFillMode ? (parsedProd: any, suppId?: string) => {
          setFormData(prev => ({
            ...prev,
            sku: parsedProd.sku || prev.sku,
            name: parsedProd.name || prev.name,
            cost: parsedProd.cost || prev.cost,
            tax: parsedProd.tax || prev.tax,
            supplierId: suppId || prev.supplierId
          }));
          setActiveTab(3); // Saltar a la pestaña de costos
        } : undefined}
      />
    </>
  );
}
