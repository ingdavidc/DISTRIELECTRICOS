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
    const searchQuery = `${query.trim()} alta calidad producto eléctrico`;
    const url = `https://www.bing.com/images/search?q=${encodeURIComponent(searchQuery)}`;
    
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
