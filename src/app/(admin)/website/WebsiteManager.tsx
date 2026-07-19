"use client";

import { useState } from "react";
import { updateWebConfig, addGalleryItem, deleteGalleryItem, searchProducts } from "@/actions/website";
import { Save, Camera, Trash2, Image as ImageIcon, Loader2, Search, Plus, X } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function WebsiteManager({ 
  initialConfig, 
  initialGallery,
  initialFlashProducts,
  initialFeaturedProducts
}: { 
  initialConfig: any, 
  initialGallery: any[],
  initialFlashProducts: any[],
  initialFeaturedProducts: any[]
}) {
  const [activeTab, setActiveTab] = useState("hero");
  const [config, setConfig] = useState(initialConfig);
  const [gallery, setGallery] = useState(initialGallery);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Flash Offers State
  const [flashProducts, setFlashProducts] = useState<any[]>(initialFlashProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      await updateWebConfig({
        heroTitle: config.heroTitle,
        heroSubtitle: config.heroSubtitle,
        useAutoFeatured: config.useAutoFeatured,
        flashOfferIds: flashProducts.map(p => p.id)
      });
      alert("Configuración guardada exitosamente");
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseKey) throw new Error("Supabase no configurado");
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `website/gallery-${Date.now()}.${fileExt}`;
      
      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, file);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);
        
      const isVideo = file.type.startsWith("video/");
      const newItem = await addGalleryItem(publicUrl, isVideo ? "VIDEO" : "IMAGE");
      
      setGallery(prev => [newItem, ...prev].slice(0, 10));
      
    } catch (err: any) {
      alert("Error subiendo archivo: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("¿Eliminar esta foto/video de la galería?")) return;
    try {
      await deleteGalleryItem(id);
      setGallery(prev => prev.filter(item => item.id !== id));
    } catch (e: any) {
      alert("Error eliminando: " + e.message);
    }
  };

  const handleSearchProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchProducts(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const addFlashProduct = (product: any) => {
    if (flashProducts.some(p => p.id === product.id)) return;
    setFlashProducts([...flashProducts, product]);
  };

  const removeFlashProduct = (id: string) => {
    setFlashProducts(flashProducts.filter(p => p.id !== id));
  };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--color-border)", marginBottom: "2rem", overflowX: "auto" }}>
        <button 
          onClick={() => setActiveTab("hero")}
          style={{ padding: "1rem", fontWeight: 600, borderBottom: activeTab === "hero" ? "2px solid var(--color-primary)" : "2px solid transparent", color: activeTab === "hero" ? "var(--color-primary)" : "var(--color-text-muted)", background: "none", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Sección Principal (Hero)
        </button>
        <button 
          onClick={() => setActiveTab("flash")}
          style={{ padding: "1rem", fontWeight: 600, borderBottom: activeTab === "flash" ? "2px solid var(--color-primary)" : "2px solid transparent", color: activeTab === "flash" ? "var(--color-primary)" : "var(--color-text-muted)", background: "none", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Ofertas Flash
        </button>
        <button 
          onClick={() => setActiveTab("gallery")}
          style={{ padding: "1rem", fontWeight: 600, borderBottom: activeTab === "gallery" ? "2px solid var(--color-primary)" : "2px solid transparent", color: activeTab === "gallery" ? "var(--color-primary)" : "var(--color-text-muted)", background: "none", cursor: "pointer", whiteSpace: "nowrap" }}
        >
          Galería (Día a Día)
        </button>
      </div>

      {/* Tab Content: Hero */}
      {activeTab === "hero" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <label className="label">Título Principal</label>
            <input 
              type="text" 
              className="input" 
              value={config.heroTitle}
              onChange={e => setConfig({...config, heroTitle: e.target.value})}
            />
          </div>
          <div>
            <label className="label">Subtítulo</label>
            <textarea 
              className="input" 
              rows={3}
              value={config.heroSubtitle}
              onChange={e => setConfig({...config, heroSubtitle: e.target.value})}
            />
          </div>
          
          <div style={{ padding: "1.5rem", background: "var(--color-background)", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Productos Destacados (Página Principal)</h3>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={config.useAutoFeatured}
                onChange={e => setConfig({...config, useAutoFeatured: e.target.checked})}
              />
              Mostrar automáticamente los productos más recientes (Recomendado)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button className="btn btn-primary" onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar Configuración
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Flash Offers */}
      {activeTab === "flash" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div style={{ background: "var(--color-background)", padding: "1.5rem", borderRadius: "var(--radius-lg)" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Buscar Productos</h3>
            <form onSubmit={handleSearchProduct} style={{ display: "flex", gap: "1rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                <input 
                  type="text" 
                  className="input" 
                  style={{ paddingLeft: "2.5rem" }} 
                  placeholder="Buscar por nombre o código..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary" disabled={isSearching}>
                {isSearching ? "Buscando..." : "Buscar"}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div style={{ marginTop: "1rem", display: "grid", gap: "0.5rem", maxHeight: "300px", overflowY: "auto", padding: "0.5rem", background: "white", borderRadius: "var(--radius-md)" }}>
                {searchResults.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", borderBottom: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "40px", height: "40px", background: "var(--color-background)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <ImageIcon size={20} />}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{p.name}</div>
                        <div style={{ color: "var(--color-primary)", fontWeight: 700, fontSize: "0.85rem" }}>${p.price.toLocaleString()}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => addFlashProduct(p)}
                      className="btn" 
                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.85rem", background: "var(--color-light-gray)", border: "1px solid var(--color-border)" }}
                      disabled={flashProducts.some(fp => fp.id === p.id)}
                    >
                      <Plus size={16} /> Agregar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Productos Seleccionados para Ofertas Flash ({flashProducts.length})</h3>
            {flashProducts.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-muted)", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                No has seleccionado ningún producto para Ofertas Flash.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.5rem" }}>
                {flashProducts.map(p => (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "white", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                      <div style={{ width: "40px", height: "40px", background: "var(--color-background)", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                        {p.imageUrl ? <img src={p.imageUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : <ImageIcon size={20} />}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{p.name}</div>
                    </div>
                    <button 
                      onClick={() => removeFlashProduct(p.id)}
                      style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.5rem", borderRadius: "50%" }}
                      className="hover-bg-light"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button className="btn btn-primary" onClick={handleSaveConfig} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar Ofertas Flash
            </button>
          </div>
        </div>
      )}

      {/* Tab Content: Gallery */}
      {activeTab === "gallery" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ fontWeight: 600 }}>Fotos del Día a Día</h3>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>Máximo 10 fotos o videos cortos. Las más antiguas se borran automáticamente.</p>
            </div>
            
            <div style={{ position: "relative" }}>
              <input 
                type="file" 
                accept="image/*,video/*" 
                capture="environment"
                onChange={handleUploadPhoto}
                disabled={isUploading}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 10 }}
              />
              <button className="btn btn-secondary">
                {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Camera size={18} />}
                Tomar / Subir Foto
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {gallery.length === 0 && (
              <div style={{ gridColumn: "1 / -1", padding: "3rem", textAlign: "center", color: "var(--color-text-muted)", border: "2px dashed var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                <ImageIcon size={48} style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
                <p>No hay fotos en la galería.</p>
              </div>
            )}
            
            {gallery.map((item: any) => (
              <div key={item.id} style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", aspectRatio: "1/1", background: "#f0f0f0" }}>
                {item.type === "VIDEO" ? (
                  <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls />
                ) : (
                  <img src={item.url} alt="Galería" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                
                <button 
                  onClick={() => handleDeletePhoto(item.id)}
                  style={{ position: "absolute", top: "0.5rem", right: "0.5rem", background: "rgba(255,0,0,0.8)", color: "white", border: "none", borderRadius: "50%", padding: "0.5rem", cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
