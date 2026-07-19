"use client";

import { useState } from "react";
import { updateWebConfig, addGalleryItem, deleteGalleryItem } from "@/actions/website";
import { Save, Camera, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

export default function WebsiteManager({ initialConfig, initialGallery }: { initialConfig: any, initialGallery: any[] }) {
  const [activeTab, setActiveTab] = useState("hero");
  const [config, setConfig] = useState(initialConfig);
  const [gallery, setGallery] = useState(initialGallery);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      await updateWebConfig({
        heroTitle: config.heroTitle,
        heroSubtitle: config.heroSubtitle,
        featuredAuto: config.featuredAuto
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
      
      // Subir archivo al bucket 'products'
      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, file);
        
      if (error) throw error;
      
      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);
        
      // Guardar en BD
      const isVideo = file.type.startsWith("video/");
      const newItem = await addGalleryItem(publicUrl, isVideo ? "VIDEO" : "IMAGE");
      
      // Actualizar estado (agregando al inicio, FIFO)
      setGallery(prev => [newItem, ...prev].slice(0, 10)); // max 10
      
    } catch (err: any) {
      alert("Error subiendo archivo: " + err.message);
    } finally {
      setIsUploading(false);
      e.target.value = ""; // reset input
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

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--color-border)", marginBottom: "2rem" }}>
        <button 
          onClick={() => setActiveTab("hero")}
          style={{ padding: "1rem", fontWeight: 600, borderBottom: activeTab === "hero" ? "2px solid var(--color-primary)" : "2px solid transparent", color: activeTab === "hero" ? "var(--color-primary)" : "var(--color-text-muted)", background: "none", cursor: "pointer" }}
        >
          Sección Principal (Hero)
        </button>
        <button 
          onClick={() => setActiveTab("gallery")}
          style={{ padding: "1rem", fontWeight: 600, borderBottom: activeTab === "gallery" ? "2px solid var(--color-primary)" : "2px solid transparent", color: activeTab === "gallery" ? "var(--color-primary)" : "var(--color-text-muted)", background: "none", cursor: "pointer" }}
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
            <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Productos Destacados</h3>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
              <input 
                type="checkbox" 
                checked={config.featuredAuto}
                onChange={e => setConfig({...config, featuredAuto: e.target.checked})}
              />
              Mostrar automáticamente los productos más recientes/vendidos
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
