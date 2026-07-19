import { getWebConfig, getWebGallery } from "@/actions/website";
import WebsiteManager from "./WebsiteManager";

export default async function WebsiteAdminPage() {
  const config = await getWebConfig();
  const gallery = await getWebGallery();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Gestor Web (CMS)</h1>
        <p className="page-subtitle">Modifica la apariencia y el contenido de tu página pública.</p>
      </div>

      <div className="card">
        <WebsiteManager initialConfig={config} initialGallery={gallery} />
      </div>
    </div>
  );
}
