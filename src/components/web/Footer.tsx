import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ background: "var(--color-primary)", color: "white", paddingTop: "4rem", paddingBottom: "2rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem" }}>
        
        <div>
          <Link href="/dashboard" style={{ textDecoration: "none", cursor: "default", outline: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="logo-electric"
                style={{ height: "45px", width: "45px", objectFit: "contain" }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "white", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                  DISTRIELECTRICOS <span style={{ color: "var(--color-secondary)" }}>E&D</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-light-gray)", fontWeight: 600, letterSpacing: "1px" }}>
                  IDEAS CON ENERGÍA
                </div>
              </div>
            </div>
          </Link>
          <p style={{ color: "var(--color-light-gray)", fontSize: "0.9rem", lineHeight: "1.6", marginBottom: "1.5rem" }}>
            Tu aliado confiable para proyectos eléctricos, construcción y remodelación. Todo el catálogo a tu disposición 24/7.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            {/* Redes Sociales (Simuladas con Divs redondeados para mockup) */}
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>fb</div>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>ig</div>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>wa</div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Servicio al Cliente</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", color: "var(--color-light-gray)", fontSize: "0.9rem" }}>
            <li style={{ cursor: "pointer" }}>Estado de mi pedido</li>
            <li style={{ cursor: "pointer" }}>Cambios y devoluciones</li>
            <li style={{ cursor: "pointer" }}>Preguntas Frecuentes</li>
            <li style={{ cursor: "pointer" }}>Garantías</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Soluciones B2B</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem", color: "var(--color-light-gray)", fontSize: "0.9rem" }}>
            <li style={{ cursor: "pointer" }}>Ventas Corporativas</li>
            <li style={{ cursor: "pointer" }}>Portal Constructores</li>
            <li style={{ cursor: "pointer" }}>Cotización por Volumen</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.5rem" }}>Boletín Informativo</h4>
          <p style={{ color: "var(--color-light-gray)", fontSize: "0.9rem", marginBottom: "1rem" }}>
            Suscríbete y recibe ofertas exclusivas para tus proyectos.
          </p>
          <div style={{ display: "flex" }}>
            <input 
              type="email" 
              placeholder="Tu correo electrónico" 
              style={{ padding: "0.75rem", borderRadius: "var(--radius-md) 0 0 var(--radius-md)", border: "none", outline: "none", flex: 1 }}
            />
            <button style={{ background: "var(--color-secondary)", color: "white", padding: "0 1.5rem", borderRadius: "0 var(--radius-md) var(--radius-md) 0", fontWeight: 600 }}>
              Enviar
            </button>
          </div>
        </div>

      </div>
      <div style={{ marginTop: "4rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
        <div>&copy; {new Date().getFullYear()} Distrielectricos E&D. Todos los derechos reservados.</div>
        
        <a 
          href="https://www.dctelematica.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="powered-link"
        >
          <span style={{ fontSize: "0.7rem", letterSpacing: "1px", fontWeight: 600 }}>POWERED BY</span>
          {/* Fallback to text if image is not placed yet, but assuming dc-telematica.png is in public */}
          <img 
            src="/dc-telematica.png" 
            alt="DC Telematica" 
            style={{ height: "26px", objectFit: "contain" }} 
          />
        </a>
      </div>
    </footer>
  );
}
