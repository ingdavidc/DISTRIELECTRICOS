"use server";

import { auth } from "@/auth";

export async function searchProductImage(query: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    if (!query || query.trim() === "") {
      return { success: false, error: "Término de búsqueda vacío" };
    }

    // Usaremos Bing Images porque Google bloquea las IPs de Vercel/Datacenters
    // No agregamos sufijos genéricos porque Bing puede auto-corregir palabras como "SUMMETER" a "SUMMER" y mostrar fotos erróneas
    const searchQuery = query.trim();
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}&FORM=HDRSC2`;
    
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });
    
    if (!res.ok) {
      throw new Error(`Bing returned ${res.status}`);
    }

    const text = await res.text();
    
    // Extraer URLs de las imágenes usando regex sobre el payload de Bing
    const murlRegex = /murl&quot;:&quot;(.*?)&quot;/g;
    let match;
    const urls: string[] = [];
    
    while ((match = murlRegex.exec(text)) !== null) {
      if (urls.length < 8) {
        let extractedUrl = match[1];
        if (extractedUrl.startsWith("http://")) {
          extractedUrl = extractedUrl.replace("http://", "https://");
        }
        if (!urls.includes(extractedUrl)) {
          urls.push(extractedUrl);
        }
      } else {
        break;
      }
    }
    
    const results = urls.map(url => ({
      url: url,
      preview: url,
      title: "Imagen de Bing",
      website: ""
    }));

    if (results.length === 0) {
      return { success: false, error: "No se encontraron imágenes" };
    }

    return { success: true, images: results };
  } catch (error: any) {
    console.error("Error buscando imágenes:", error);
    return { success: false, error: "Error interno al buscar imágenes" };
  }
}

import { createClient } from "@supabase/supabase-js";

export async function downloadAndUploadExternalImage(externalUrl: string): Promise<{success: boolean, url?: string, error?: string}> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    const res = await fetch(externalUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      throw new Error(`Failed to download image: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    
    // Upload to Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured on server");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Create random filename
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpeg";
    const fileName = `ai_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });
      
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Error downloading/uploading image:", error);
    return { success: false, error: error.message };
  }
}

export async function fetchImageForCropping(imageUrl: string): Promise<{ success: boolean; dataUrl?: string; error?: string }> {
  try {
    if (!imageUrl) {
      return { success: false, error: "URL de imagen no proporcionada" };
    }

    if (imageUrl.startsWith("data:")) {
      return { success: true, dataUrl: imageUrl };
    }

    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status} al descargar imagen`);
    }

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return { success: true, dataUrl };
  } catch (error: any) {
    console.error("Error in fetchImageForCropping:", error);
    return { success: false, error: error.message || "Error al obtener imagen para recorte" };
  }
}

export async function saveCroppedImage(base64Data: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "No autorizado" };
    }

    if (!base64Data || !base64Data.startsWith("data:image/")) {
      return { success: false, error: "Formato de imagen inválido" };
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: "Formato de imagen inválido" };
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], "base64");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Credenciales de Supabase no configuradas");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpeg";
    const fileName = `crop_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(fileName, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("products")
      .getPublicUrl(fileName);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error("Error in saveCroppedImage:", error);
    return { success: false, error: error.message || "Error al guardar imagen recortada" };
  }
}
