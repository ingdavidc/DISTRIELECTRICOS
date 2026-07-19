import { getWebConfig, getWebGallery, getProductsByIds } from "@/actions/website";
import WebsiteManager from "./WebsiteManager";

export default async function WebsiteAdminPage() {
  const config = await getWebConfig();
  const gallery = await getWebGallery();

  const flashProducts = await getProductsByIds(config.flashOfferIds || []);
  const featuredProducts = await getProductsByIds(config.featuredProductIds || []);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Gestor Web (CMS)</h1>
        <p className="page-subtitle">Modifica la apariencia y el contenido de tu página pública.</p>
      </div>

      <div className="card">
        <WebsiteManager 
          initialConfig={config} 
          initialGallery={gallery} 
          initialFlashProducts={flashProducts}
          initialFeaturedProducts={featuredProducts}
        />
      </div>
    </div>
  );
}
