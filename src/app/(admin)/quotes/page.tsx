import { getQuoteRequests } from "@/actions/quotes";
import QuotesClient from "./QuotesClient";

export default async function AdminQuotesPage() {
  const quotes = await getQuoteRequests();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Cotizaciones B2B</h1>
        <p className="page-subtitle">Gestiona las solicitudes de cotización de tus clientes corporativos.</p>
      </div>

      <div className="card">
        <QuotesClient initialQuotes={quotes} />
      </div>
    </div>
  );
}
