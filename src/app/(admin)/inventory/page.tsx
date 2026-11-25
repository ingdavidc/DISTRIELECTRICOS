"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Loader2, X, Save, Box, DollarSign, Image as ImageIcon, Sparkles, Printer, RefreshCw, ArrowUp, ArrowDown, Crop, Star } from "lucide-react";
import { getInventoryProducts, getCategories, createProduct, updateProduct, deleteProduct, createCategory, deleteCategory, ProductInputData, getTotalProductsCount } from "@/actions/inventory";
import { getSuppliers } from "@/actions/purchases";
import AiPdfModal from "@/components/admin/AiPdfModal";
import ImageCropperModal from "@/components/admin/ImageCropperModal";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";
import { Trash2, Edit } from "lucide-react";
import imageCompression from "browser-image-compression";
import { NumericFormat } from "react-number-format";
import { searchProductImage, downloadAndUploadExternalImage } from "@/actions/image-search";
import ProductSearchAutocomplete from "@/components/ProductSearchAutocomplete";

import { Product } from "@prisma/client";
type Supplier = Awaited<ReturnType<typeof getSuppliers>>[0];
type Category = Awaited<ReturnType<typeof getCategories>>[0];

const initialProductState: ProductInputData = {
  name: "", sku: "", commercialName: "", description: "", features: "", brand: "", categoryId: "",
  unit: "Und", stock: 0, minStockLimit: 10, maxStockLimit: 100, location: "",
  cost: 0, profitMargin: 30, expertDiscount: 5, volumeDiscount: 10, corporateDiscount: 15, tax: 19, price: 0,
  supplierId: "", altSupplierId: "", imageUrl: "", imageUrls: [], technicalSheetUrl: "", salesCount: 0, popularity: 0
};

function calculateSuggestedPvp(cost: number, profitMargin: number, tax: number): number {
  const c = Number(cost) || 0;
  const m = Number(profitMargin) || 0;
  const t = Number(tax) || 0;
  const costWithTax = c + (c * t) / 100;
  let u = 1 - (m / 100);
  if (u <= 0) u = 0.01;
  return Math.ceil((costWithTax / u) / 100) * 100;
}

function InventoryContent() {
  const searchParams = useSearchParams();
  const initialUrlQuery = searchParams.get("search") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialUrlQuery);
  const [limit, setLimit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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

  // Image Assistant State (strictly isolated per product modal session)
  const [isSearchingImage, setIsSearchingImage] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<any[]>([]);
  const [failedAiImages, setFailedAiImages] = useState<Record<string, boolean>>({});
  const [aiUrlToUploadedUrl, setAiUrlToUploadedUrl] = useState<Record<string, string>>({});
  const [directUrlInput, setDirectUrlInput] = useState("");
  const searchSessionRef = useRef(0);

  // Table search coordination refs
  const loadRequestIdRef = useRef(0);
  const skipNextDebounceRef = useRef(false);

  // Image Cropper State
  const [cropperState, setCropperState] = useState<{
    isOpen: boolean;
    imageUrl?: string | null;
    targetIndex?: number;
    sourceAiUrl?: string;
  }>({
    isOpen: false,
    imageUrl: null
  });

  const resetModalTransientState = () => {
    searchSessionRef.current += 1;
    setImageSearchResults([]);
    setIsSearchingImage(false);
    setFailedAiImages({});
    setAiUrlToUploadedUrl({});
    setDirectUrlInput("");
    setCropperState({ isOpen: false, imageUrl: null });
  };

  const handleCropComplete = (croppedUrl: string) => {
    const sourceAiUrl = cropperState.sourceAiUrl;
    if (cropperState.targetIndex !== undefined && cropperState.targetIndex >= 0) {
      const idx = cropperState.targetIndex;
      setFormData(prev => {
        const newUrls = [...(prev.imageUrls || [])];
        newUrls[idx] = croppedUrl;
        return {
          ...prev,
          imageUrls: newUrls,
          imageUrl: idx === 0 ? croppedUrl : (newUrls[0] || "")
        };
      });
      toast.success("Imagen de galería actualizada con el recorte");
    } else {
      let addedCount = 0;
      let limitReached = false;
      setFormData(prev => {
        const current = prev.imageUrls || [];
        if (current.length >= 5) {
          limitReached = true;
          return prev;
        }
        const updated = Array.from(new Set([...current, croppedUrl]));
        addedCount = updated.length;
        return {
          ...prev,
          imageUrl: updated[0] || croppedUrl,
          imageUrls: updated
        };
      });
      if (limitReached) {
        toast.error("Máximo 5 imágenes permitidas por producto");
      } else {
        if (sourceAiUrl) {
          setAiUrlToUploadedUrl(prev => ({ ...prev, [sourceAiUrl]: croppedUrl }));
        }
        toast.success(`Imagen recortada agregada (${addedCount}/5)`);
      }
    }
    setCropperState({ isOpen: false, imageUrl: null });
  };

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.target;
    const files = inputEl.files;
    if (!files || files.length === 0) return;

    if ((formData.imageUrls?.length || 0) + files.length > 5) {
      toast.error("Máximo 5 imágenes por producto");
      inputEl.value = "";
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
        const options = {
          maxSizeMB: 0.1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          fileType: "image/jpeg" as string,
        };
        const compressedFile = await imageCompression(file, options);
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9]/g, "_")}.jpeg`;

        const { error } = await supabase.storage
          .from("products")
          .upload(fileName, compressedFile, { contentType: "image/jpeg", upsert: true });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(fileName);
        newUrls.push(publicUrl);
      }

      setFormData(prev => {
        const updatedUrls = Array.from(new Set([...(prev.imageUrls || []), ...newUrls])).slice(0, 5);
        return {
          ...prev,
          imageUrls: updatedUrls,
          imageUrl: updatedUrls[0] || ""
        };
      });
      toast.success("Imágenes subidas con éxito", { id: tid });
    } catch (error: any) {
      console.error(error);
      toast.error("Error al subir: " + (error.message || "Revisa las políticas de Supabase"), { duration: 5000 });
    } finally {
      inputEl.value = "";
      setIsUploadingImage(false);
    }
  };

  const handleAddDirectUrl = () => {
    const clean = directUrlInput.trim();
    if (!clean) return;
    if ((formData.imageUrls?.length || 0) >= 5) {
      toast.error("Máximo 5 imágenes permitidas por producto");
      return;
    }
    setFormData(prev => {
      const updated = Array.from(new Set([...(prev.imageUrls || []), clean])).slice(0, 5);
      return {
        ...prev,
        imageUrls: updated,
        imageUrl: updated[0] || ""
      };
    });
    setDirectUrlInput("");
    toast.success("URL agregada a la galería");
  };

  const handleSetPrimaryImage = (indexToPromote: number) => {
    if (indexToPromote === 0) return;
    setFormData(prev => {
      const current = [...(prev.imageUrls || [])];
      if (!current[indexToPromote]) return prev;
      const [chosen] = current.splice(indexToPromote, 1);
      const updated = [chosen, ...current];
      return {
        ...prev,
        imageUrls: updated,
        imageUrl: updated[0] || ""
      };
    });
    toast.success("Imagen principal actualizada");
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

  const handleSearchImage = async () => {
    if (!formData.name) {
      toast.error("Por favor ingresa primero el Nombre del producto");
      return;
    }

    const sessionId = ++searchSessionRef.current;
    setIsSearchingImage(true);
    setImageSearchResults([]);
    setFailedAiImages({});

    const query = `${formData.name} ${formData.brand || ""} ${formData.sku || ""}`.trim();
    const tid = toast.loading(`Buscando imágenes para "${query}"...`);

    try {
      const res = await searchProductImage(query);
      if (sessionId !== searchSessionRef.current) {
        toast.dismiss(tid);
        return;
      }
      if (res.success && res.images) {
        setImageSearchResults(res.images);
        toast.success(`Encontradas ${res.images.length} opciones`, { id: tid });
      } else {
        toast.error(res.error || "No se encontraron resultados", { id: tid });
      }
    } catch (err) {
      if (sessionId === searchSessionRef.current) {
        toast.error("Error al conectar con el asistente visual", { id: tid });
      } else {
        toast.dismiss(tid);
      }
    } finally {
      if (sessionId === searchSessionRef.current) {
        setIsSearchingImage(false);
      }
    }
  };

  const [formData, setFormData] = useState<ProductInputData>(initialProductState);
  const [initialFormData, setInitialFormData] = useState<ProductInputData>(initialProductState);
  const [debouncedSearch, setDebouncedSearch] = useState(initialUrlQuery);
  const lastAppliedUrlSearchRef = useRef(initialUrlQuery);

  // Sync URL params (?search=... or ?action=new) from GlobalSearch / Shortcuts
  useEffect(() => {
    const qParam = searchParams.get("search") || "";
    const actionParam = searchParams.get("action");

    if (qParam.trim() !== "" && qParam !== lastAppliedUrlSearchRef.current) {
      lastAppliedUrlSearchRef.current = qParam;
      skipNextDebounceRef.current = true;
      setSearchTerm(qParam);
      setDebouncedSearch(qParam);
    }

    if (actionParam === "new") {
      resetModalTransientState();
      setEditingProductId(null);
      setFormData(initialProductState);
      setInitialFormData(initialProductState);
      setActiveTab(1);
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Debounce typing in search bar
  useEffect(() => {
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadData = async (searchOverride?: string) => {
    const reqId = ++loadRequestIdRef.current;
    setIsLoading(true);
    try {
      const query = typeof searchOverride === "string" ? searchOverride : debouncedSearch;
      const [prods, count, sups, cats] = await Promise.all([
        getInventoryProducts(limit, sortField, sortOrder, query),
        getTotalProductsCount(query),
        getSuppliers(),
        getCategories()
      ]);

      if (reqId !== loadRequestIdRef.current) return;

      if (prods && (prods as any).error) {
        throw new Error((prods as any).error);
      }

      setProducts(prods as any[]);
      setTotalCount(count);
      setSuppliers(sups);
      setCategories(cats);
    } catch (error: any) {
      if (reqId === loadRequestIdRef.current) {
        console.error("loadData error:", error);
        toast.error(`Error al cargar datos: ${error.message || "Fallo de conexión"}`);
      }
    } finally {
      if (reqId === loadRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleSelectProduct = (product: any) => {
    const term = product.sku || product.name;
    skipNextDebounceRef.current = true;
    setSearchTerm(term);
    setDebouncedSearch(term);
    setProducts(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (!exists) {
        return [product as any, ...prev];
      }
      return prev;
    });
  };

  const handleClearSearch = () => {
    skipNextDebounceRef.current = true;
    lastAppliedUrlSearchRef.current = "";
    setSearchTerm("");
    setDebouncedSearch("");
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  };

  useEffect(() => {
    loadData();
  }, [limit, sortField, sortOrder, debouncedSearch]);

  useEffect(() => {
    // Setup Supabase Realtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);

      const channel = supabase
        .channel("inventory-changes")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "Order" },
          () => {
            toast.success("🚨 ¡Nueva venta registrada en el POS!", {
              duration: 5000, icon: "🛎️", style: { background: "var(--color-primary)", color: "#fff", fontWeight: "bold" }
            });
            loadData();
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, []);

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
    resetModalTransientState();
    setIsModalOpen(false);
  };

  const handleCloseModalRef = useRef(handleCloseModal);
  useEffect(() => {
    handleCloseModalRef.current = handleCloseModal;
  }, [handleCloseModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (cropperState.isOpen || isAiModalOpen) return;
      if (isCategoryModalOpen) {
        setIsCategoryModalOpen(false);
        return;
      }
      if (isModalOpen) {
        handleCloseModalRef.current();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isCategoryModalOpen, cropperState.isOpen, isAiModalOpen]);

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.sku?.trim() || !formData.categoryId) {
      toast.error("Por favor completa los campos obligatorios en la pestaña 1 (Nombre, SKU y Categoría)");
      setActiveTab(1);
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading(editingProductId ? "Guardando cambios del producto..." : "Creando producto...");

    try {
      const finalImages = Array.from(new Set([...(formData.imageUrls || [])].filter(Boolean)));
      if (finalImages.length === 0 && formData.imageUrl?.trim()) {
        finalImages.push(formData.imageUrl.trim());
      }
      const dataToSave: ProductInputData = {
        ...formData,
        imageUrls: finalImages,
        imageUrl: finalImages[0] || ""
      };

      const result = editingProductId
        ? await updateProduct(editingProductId, dataToSave)
        : await createProduct(dataToSave);

      if (result.success) {
        toast.success(editingProductId ? "¡Producto actualizado con éxito!" : "¡Producto creado con éxito!", { id: toastId, duration: 4000 });
        resetModalTransientState();
        setIsModalOpen(false);
        setFormData(initialProductState);
        setInitialFormData(initialProductState);
        setEditingProductId(null);
        setActiveTab(1);
        await loadData();
      } else {
        toast.error(result.error || "Error al guardar el producto", { id: toastId, duration: 5000 });
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Error al guardar: ${err.message || "Fallo de conexión"}`, { id: toastId, duration: 5000 });
    } finally {
      setIsSaving(false);
    }
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
    resetModalTransientState();
    setEditingProductId(prod.id);
    const normalizedUrls: string[] = Array.isArray(prod.imageUrls) && prod.imageUrls.length > 0
      ? prod.imageUrls.filter(Boolean)
      : (prod.imageUrl ? [prod.imageUrl] : []);

    const updatedFormData: ProductInputData = {
      name: prod.name, sku: prod.sku, commercialName: prod.commercialName || "", description: prod.description || "", features: prod.features || "", brand: prod.brand || "", categoryId: prod.categoryId,
      unit: prod.unit, stock: prod.stock, minStockLimit: prod.minStockLimit, maxStockLimit: prod.maxStockLimit || 100, location: prod.location || "",
      cost: prod.cost, profitMargin: prod.profitMargin, expertDiscount: prod.expertDiscount ?? 5, volumeDiscount: prod.volumeDiscount ?? 10, corporateDiscount: prod.corporateDiscount ?? 15, tax: prod.tax ?? 19, price: prod.price,
      supplierId: prod.supplierId || "", altSupplierId: prod.altSupplierId || "", imageUrl: normalizedUrls[0] || prod.imageUrl || "", imageUrls: normalizedUrls, technicalSheetUrl: prod.technicalSheetUrl || "", salesCount: prod.salesCount || 0, popularity: prod.popularity || 0
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

  const filteredProducts = products.filter(p => {
    if (!searchTerm.trim()) return true;
    const tokens = searchTerm.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const searchString = `${p.name} ${p.sku} ${p.brand || ''} ${p.commercialName || ''}`.toLowerCase();
    return tokens.every(token => searchString.includes(token));
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ArrowUp size={14} style={{ display: "inline", marginLeft: "4px" }} /> : <ArrowDown size={14} style={{ display: "inline", marginLeft: "4px" }} />;
  };

  return (
    <>
      <div className="page-header" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Inventario y Abastecimiento</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", maxWidth: "600px", marginTop: "0.5rem" }}>
            Gestiona stock, ficha técnica y configura compras automáticas. ({totalCount} productos en BD)
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button className="btn btn-outline" style={{ borderColor: "var(--color-secondary)", color: "var(--color-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }} onClick={() => { setAiFillMode(false); setIsAiModalOpen(true); }}>
            <Sparkles size={18} />
            Importar PDF con IA
          </button>
          <button className="btn btn-outline" onClick={() => setIsCategoryModalOpen(true)}>
            Gestionar Categorías
          </button>
          <button className="btn btn-primary" onClick={() => { resetModalTransientState(); setEditingProductId(null); setFormData(initialProductState); setInitialFormData(initialProductState); setActiveTab(1); setIsModalOpen(true); }}>
            <Plus size={18} />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: "0" }}>
        <div style={{ padding: "1.5rem", display: "flex", gap: "1rem", borderBottom: "1px solid var(--color-border)", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", zIndex: 2, pointerEvents: "none" }} />
            <ProductSearchAutocomplete 
              placeholder="Buscar por SKU, nombre o marca..." 
              value={searchTerm}
              onChange={(val) => setSearchTerm(val)}
              onSelect={handleSelectProduct}
              className="input" 
              style={{ paddingLeft: "38px", paddingRight: searchTerm ? "62px" : "36px" }}
              loaderRight={searchTerm ? "38px" : "12px"}
              showStock={true}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 4,
                }}
                title="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select 
            className="input" 
            style={{ width: "auto" }} 
            value={limit} 
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={20}>Mostrar 20</option>
            <option value={50}>Mostrar 50</option>
            <option value={100}>Mostrar 100</option>
            <option value={500}>Mostrar 500</option>
          </select>
          <button type="button" className="btn btn-outline" onClick={() => loadData()} disabled={isLoading}>
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            Recargar
          </button>
        </div>

        <div className="data-table-container" style={{ border: "none", borderRadius: "0 0 var(--radius-lg) var(--radius-lg)", opacity: isLoading && products.length > 0 ? 0.65 : 1, transition: "opacity 0.2s" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("sku")} style={{ cursor: "pointer", userSelect: "none" }}>SKU {renderSortIcon("sku")}</th>
                <th onClick={() => handleSort("name")} style={{ cursor: "pointer", userSelect: "none" }}>Producto / Marca {renderSortIcon("name")}</th>
                <th onClick={() => handleSort("cost")} style={{ cursor: "pointer", userSelect: "none" }}>Costo {renderSortIcon("cost")}</th>
                <th onClick={() => handleSort("price")} style={{ cursor: "pointer", userSelect: "none" }}>PVP {renderSortIcon("price")}</th>
                <th onClick={() => handleSort("stock")} style={{ cursor: "pointer", userSelect: "none" }}>Stock / Medida {renderSortIcon("stock")}</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && filteredProducts.length === 0 ? (
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
                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {prod.name}
                          {(prod.imageUrl || (prod.imageUrls && prod.imageUrls.length > 0)) && (
                            <span title="El producto tiene imágenes asignadas" style={{ display: 'flex', alignItems: 'center' }}>
                              <ImageIcon size={14} color="var(--color-primary)" style={{ opacity: 0.7 }} />
                            </span>
                          )}
                        </div>
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
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "2rem" }}>
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
            <form onSubmit={handleSaveSubmit} noValidate style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
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
                      <label style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-primary)" }}>Ventas Reales</label>
                      <NumericFormat 
                        className="input"
                        value={formData.salesCount}
                        onValueChange={(v) => setFormData({...formData, salesCount: v.floatValue || 0})}
                        allowNegative={false}
                        decimalScale={0}
                        placeholder="0"
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--color-primary)" }}>Popularidad Manual</label>
                      <select 
                        className="input" 
                        value={formData.popularity} 
                        onChange={(e) => setFormData({...formData, popularity: parseInt(e.target.value) || 0})}
                      >
                        <option value={0}>Sin destacar (0 Estrellas)</option>
                        <option value={1}>⭐ (1 Estrella)</option>
                        <option value={2}>⭐⭐ (2 Estrellas)</option>
                        <option value={3}>⭐⭐⭐ (3 Estrellas)</option>
                        <option value={4}>⭐⭐⭐⭐ (4 Estrellas)</option>
                        <option value={5}>⭐⭐⭐⭐⭐ (5 Estrellas)</option>
                      </select>
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
                      <input required type="number" min="0" className="input" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})} />
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
                          onValueChange={(values, sourceInfo) => {
                            if (sourceInfo?.source !== "event") return;
                            const newCost = values.floatValue || 0;
                            setFormData(prev => ({
                              ...prev,
                              cost: newCost,
                              price: calculateSuggestedPvp(newCost, prev.profitMargin, prev.tax)
                            }));
                          }} 
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Porcentaje de Utilidad Esperada</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="input"
                          value={formData.profitMargin}
                          onChange={(e) => {
                            const newMargin = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              profitMargin: newMargin,
                              price: calculateSuggestedPvp(prev.cost, newMargin, prev.tax)
                            }));
                          }}
                        />
                        <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Impuestos (IVA)</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="input"
                          value={formData.tax}
                          onChange={(e) => {
                            const newTax = parseFloat(e.target.value) || 0;
                            setFormData(prev => ({
                              ...prev,
                              tax: newTax,
                              price: calculateSuggestedPvp(prev.cost, prev.profitMargin, newTax)
                            }));
                          }}
                        />
                        <span style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", fontWeight: 600 }}>%</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fila de Descuentos (Multi-tier Pricing) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontWeight: 600, fontSize: "0.95rem" }}>Dcto. Aliado Experto</label>
                      <div style={{ position: "relative" }}>
                        <input type="number" min="0" max="100" className="input" value={formData.expertDiscount} onChange={(e) => setFormData({...formData, expertDiscount: parseFloat(e.target.value) || 0})} />
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
                            <div key={`${url}-${idx}`} style={{ position: "relative", width: "100px", height: "100px", borderRadius: "var(--radius-md)", overflow: "hidden", border: idx === 0 ? "2px solid var(--color-primary)" : "1px solid var(--color-border)", flexShrink: 0, background: "#fff" }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Preview ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <button 
                                type="button" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCropperState({ isOpen: true, imageUrl: url, targetIndex: idx });
                                }} 
                                title="Recortar imagen (quitar marca de agua o ajustar)" 
                                style={{ position: "absolute", top: "4px", left: "4px", background: "rgba(32, 53, 98, 0.85)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                              >
                                <Crop size={12} />
                              </button>
                              <button type="button" onClick={() => handleRemoveImage(idx)} title="Eliminar imagen" style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(255,0,0,0.85)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px" }}>
                                <X size={14} />
                              </button>
                              {idx === 0 ? (
                                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(32,53,98,0.88)", color: "white", fontSize: "0.62rem", fontWeight: 700, textAlign: "center", padding: "2px 0" }}>
                                  Principal
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  title="Marcar como imagen principal"
                                  style={{ position: "absolute", bottom: "4px", left: "4px", background: "rgba(255,255,255,0.92)", color: "var(--color-secondary)", border: "1px solid var(--color-border)", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }}
                                >
                                  <Star size={12} />
                                </button>
                              )}
                            </div>
                          ))
                        ) : formData.imageUrl ? (
                          <div style={{ position: "relative", width: "100px", height: "100px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "2px solid var(--color-primary)", flexShrink: 0, background: "#fff" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={formData.imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <button 
                              type="button" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setCropperState({ isOpen: true, imageUrl: formData.imageUrl });
                              }} 
                              title="Recortar imagen" 
                              style={{ position: "absolute", top: "4px", left: "4px", background: "rgba(32, 53, 98, 0.85)", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                            >
                              <Crop size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, imageUrl: "", imageUrls: [] }))}
                              title="Eliminar imagen"
                              style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(255,0,0,0.85)", color: "white", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "12px" }}
                            >
                              <X size={14} />
                            </button>
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
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <input 
                              type="text" 
                              className="input" 
                              value={directUrlInput} 
                              onChange={(e) => setDirectUrlInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddDirectUrl();
                                }
                              }}
                              placeholder="Pegar URL directa de imagen..." 
                              style={{ flex: "1 1 200px" }}
                            />
                            {directUrlInput.trim() && (
                              <>
                                <button
                                  type="button"
                                  onClick={handleAddDirectUrl}
                                  className="btn btn-outline"
                                  style={{ display: "flex", alignItems: "center", gap: "0.3rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}
                                >
                                  <Plus size={15} /> Usar URL
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCropperState({ isOpen: true, imageUrl: directUrlInput.trim() })}
                                  className="btn btn-outline"
                                  style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.5rem 0.75rem", fontSize: "0.85rem", color: "var(--color-secondary, #f39423)", borderColor: "var(--color-secondary, #f39423)" }}
                                >
                                  <Crop size={15} /> Recortar URL
                                </button>
                              </>
                            )}
                            <button 
                              type="button" 
                              onClick={handleSearchImage}
                              disabled={isSearchingImage}
                              className="btn btn-outline" 
                              style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
                            >
                              {isSearchingImage ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                              {isSearchingImage ? "Buscando..." : "Asistente IA"}
                            </button>
                          </div>
                          
                          {/* Resultados de búsqueda IA */}
                          {imageSearchResults.length > 0 && (() => {
                            const visibleAiResults = imageSearchResults.filter(img => !failedAiImages[img.url]);
                            return (
                              <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--color-light-gray)", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                                  <div>
                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text)", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                                      <Sparkles size={16} color="var(--color-primary)" /> Resultados Sugeridos por IA
                                    </h4>
                                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                                      Selecciona una o varias imágenes para tu producto ({formData.imageUrls?.length || 0}/5 seleccionadas)
                                    </span>
                                  </div>
                                  <button 
                                    type="button" 
                                    onClick={() => setImageSearchResults([])} 
                                    className="btn btn-outline"
                                    style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}
                                  >
                                    <X size={14} /> Listo / Cerrar
                                  </button>
                                </div>
                                {visibleAiResults.length === 0 ? (
                                  <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.85rem", background: "white", borderRadius: "var(--radius-sm)" }}>
                                    Las imágenes encontradas tenían enlaces externos protegidos. Intenta ajustar el nombre o marca e intenta de nuevo.
                                  </div>
                                ) : (
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(95px, 1fr))", gap: "0.65rem" }}>
                                    {visibleAiResults.map((img, idx) => {
                                      const mappedUploaded = aiUrlToUploadedUrl[img.url];
                                      const isAlreadyAdded = (formData.imageUrls || []).some(
                                        u => u === img.url || (mappedUploaded && u === mappedUploaded)
                                      );
                                      return (
                                        <div 
                                          key={`${img.url}-${idx}`} 
                                          onClick={async () => {
                                            if (isAlreadyAdded) {
                                              toast("Esta imagen ya está agregada al producto", { icon: "ℹ️" });
                                              return;
                                            }
                                            if ((formData.imageUrls?.length || 0) >= 5) {
                                              toast.error("Máximo 5 imágenes permitidas por producto");
                                              return;
                                            }
                                            const activeSession = searchSessionRef.current;
                                            const tid = toast.loading("Guardando imagen permanentemente...");
                                            try {
                                              const res = await downloadAndUploadExternalImage(img.url);
                                              if (activeSession !== searchSessionRef.current) {
                                                toast.dismiss(tid);
                                                return;
                                              }
                                              if (!res.success || !res.url) throw new Error(res.error || "Error al guardar");
                                              
                                              const newUrl = res.url as string;
                                              let finalCount = 0;
                                              let exceeded = false;
                                              setFormData(prev => {
                                                const current = prev.imageUrls || [];
                                                if (current.length >= 5) {
                                                  exceeded = true;
                                                  return prev;
                                                }
                                                const updated = Array.from(new Set([...current, newUrl]));
                                                finalCount = updated.length;
                                                return { 
                                                  ...prev, 
                                                  imageUrl: updated[0] || newUrl,
                                                  imageUrls: updated 
                                                };
                                              });
                                              if (exceeded) {
                                                toast.error("Máximo 5 imágenes permitidas por producto", { id: tid });
                                              } else {
                                                setAiUrlToUploadedUrl(prev => ({ ...prev, [img.url]: newUrl }));
                                                toast.success(`Imagen agregada (${finalCount}/5)`, { id: tid });
                                              }
                                            } catch (error) {
                                              if (activeSession !== searchSessionRef.current) {
                                                toast.dismiss(tid);
                                                return;
                                              }
                                              console.error(error);
                                              let finalCount = 0;
                                              let exceeded = false;
                                              setFormData(prev => {
                                                const current = prev.imageUrls || [];
                                                if (current.length >= 5) {
                                                  exceeded = true;
                                                  return prev;
                                                }
                                                const updated = Array.from(new Set([...current, img.url]));
                                                finalCount = updated.length;
                                                return { 
                                                  ...prev, 
                                                  imageUrl: updated[0] || img.url,
                                                  imageUrls: updated 
                                                };
                                              });
                                              if (exceeded) {
                                                toast.error("Máximo 5 imágenes permitidas por producto", { id: tid });
                                              } else {
                                                setAiUrlToUploadedUrl(prev => ({ ...prev, [img.url]: img.url }));
                                                toast.success(`Enlazada (${finalCount}/5)`, { id: tid });
                                              }
                                            }
                                          }}
                                          style={{ 
                                            position: "relative",
                                            aspectRatio: "1", 
                                            borderRadius: "var(--radius-sm)", 
                                            overflow: "hidden", 
                                            border: isAlreadyAdded ? "2px solid var(--color-success)" : "2px solid var(--color-border)", 
                                            cursor: isAlreadyAdded ? "default" : "pointer", 
                                            transition: "all 0.2s",
                                            background: "#fff",
                                            boxShadow: isAlreadyAdded ? "0 0 0 2px rgba(16, 185, 129, 0.25)" : "none"
                                          }}
                                          onMouseOver={(e) => {
                                            if (!isAlreadyAdded) e.currentTarget.style.borderColor = "var(--color-primary)";
                                          }}
                                          onMouseOut={(e) => {
                                            if (!isAlreadyAdded) e.currentTarget.style.borderColor = "var(--color-border)";
                                          }}
                                          title={isAlreadyAdded ? "Ya agregada al producto" : img.title || "Clic para agregar"}
                                        >
                                          {/* Botón de Recortar imagen encontrada por IA */}
                                          {!isAlreadyAdded && (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                if ((formData.imageUrls?.length || 0) >= 5) {
                                                  toast.error("Máximo 5 imágenes permitidas por producto");
                                                  return;
                                                }
                                                setCropperState({
                                                  isOpen: true,
                                                  imageUrl: img.url,
                                                  sourceAiUrl: img.url
                                                });
                                              }}
                                              title="Recortar marcas de agua o logos antes de agregar"
                                              style={{
                                                position: "absolute",
                                                top: "3px",
                                                left: "3px",
                                                background: "rgba(243, 148, 35, 0.95)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                padding: "2px 5px",
                                                fontSize: "0.62rem",
                                                fontWeight: 700,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "2px",
                                                cursor: "pointer",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                                                zIndex: 2
                                              }}
                                            >
                                              <Crop size={10} /> Recortar
                                            </button>
                                          )}
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={img.preview}
                                            referrerPolicy="no-referrer"
                                            alt=""
                                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                            loading="lazy"
                                            onError={() => setFailedAiImages(prev => ({ ...prev, [img.url]: true }))}
                                          />
                                          {isAlreadyAdded && (
                                            <div style={{ position: "absolute", top: "3px", right: "3px", background: "var(--color-success)", color: "white", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "bold", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
                                              ✓
                                            </div>
                                          )}
                                          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: isAlreadyAdded ? "rgba(16,185,129,0.9)" : "rgba(0,0,0,0.75)", color: "white", fontSize: "0.55rem", padding: "2px 4px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>
                                            {isAlreadyAdded ? "Agregada ✓" : "+ Agregar"}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          
                          <div style={{ marginTop: "0.5rem", background: "#fff3cd", border: "1px solid #ffe69c", color: "#664d03", padding: "0.75rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem" }}>
                            <strong>⚠️ Requisitos de Instagram (Ofertas/Novedades):</strong>
                            <ul style={{ paddingLeft: "1.5rem", margin: "0.25rem 0 0 0" }}>
                              <li>Las imágenes se comprimirán a JPEG (&lt;100KB) automáticamente para cumplir la norma.</li>
                              <li>Evita subir fotos demasiado alargadas (deben estar entre proporción 4:5 y 1.91:1).</li>
                            </ul>
                          </div>
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
                  
                  {activeTab < 5 && (
                    <button type="button" className="btn btn-outline" onClick={() => setActiveTab(activeTab + 1)}>Siguiente Pestaña</button>
                  )}
                  
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                    {editingProductId ? "💾 Guardar Cambios" : "💾 Guardar Producto"}
                  </button>
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
          setFormData(prev => {
            const newCost = parsedProd.cost ?? prev.cost;
            const newTax = parsedProd.tax ?? prev.tax;
            return {
              ...prev,
              sku: parsedProd.sku || prev.sku,
              name: parsedProd.name || prev.name,
              cost: newCost,
              tax: newTax,
              price: calculateSuggestedPvp(newCost, prev.profitMargin, newTax),
              supplierId: suppId || prev.supplierId
            };
          });
          setActiveTab(3); // Saltar a la pestaña de costos
        } : undefined}
      />

      {/* MODAL DE RECORTE DE IMÁGENES */}
      <ImageCropperModal
        isOpen={cropperState.isOpen}
        imageUrl={cropperState.imageUrl}
        onClose={() => setCropperState({ isOpen: false, imageUrl: null })}
        onCropComplete={handleCropComplete}
        title="Recortar y Limpiar Imagen"
      />
    </>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Cargando módulo de inventario...</div>}>
      <InventoryContent />
    </Suspense>
  );
}
