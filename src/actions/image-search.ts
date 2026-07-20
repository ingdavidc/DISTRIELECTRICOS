"use server";

import google from "googlethis";
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

    const options = {
      page: 0, 
      safe: false, 
      additional_params: { 
        hl: "es" 
      }
    };
    
    // We append terms to find better quality product images
    const searchQuery = `${query.trim()} alta calidad producto eléctrico`;
    const response = await google.image(searchQuery, options);
    
    // Return top 8 to ensure we have fallbacks
    const results = response.slice(0, 8).map((img: any) => ({
      url: img.url,
      preview: img.preview?.url || img.url,
      title: img.origin?.title || "Imagen de producto",
      website: img.origin?.website?.domain || ""
    }));

    return { success: true, images: results };
  } catch (error: any) {
    console.error("Error buscando imágenes:", error);
    return { success: false, error: "Error interno al buscar imágenes" };
  }
}
