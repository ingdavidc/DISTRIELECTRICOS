import Link from "next/link";

export default function Footer() {
  return (
    <footer className="public-footer">
      <div className="public-footer-grid">
        
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="logo-electric"
              style={{ height: "42px", width: "42px", objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontWeight: 800, fontSize: "1.35rem", color: "white", letterSpacing: "-0.5px", lineHeight: 1.1 }}>
                DISTRIELECTRICOS <span style={{ color: "var(--color-secondary)" }}>E&D</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--color-light-gray)", fontWeight: 600, letterSpacing: "1px" }}>
                IDEAS CON ENERGÍA
              </div>
            </div>
          </div>
          <p style={{ color: "var(--color-light-gray)", fontSize: "0.88rem", lineHeight: "1.6", marginBottom: "1.25rem" }}>
            Tu aliado confiable para proyectos eléctricos, construcción y remodelación. Todo el catálogo a tu disposición 24/7.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>fb</div>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>ig</div>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700 }}>wa</div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>Servicio al Cliente</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.65rem", color: "var(--color-light-gray)", fontSize: "0.88rem" }}>
            <li>
              <Link href="/estado-pedido" style={{ textDecoration: "none", color: "inherit" }}>
                Estado de mi pedido
              </Link>
            </li>
            <li style={{ cursor: "pointer" }}>Cambios y devoluciones</li>
            <li style={{ cursor: "pointer" }}>Preguntas Frecuentes</li>
            <li style={{ cursor: "pointer" }}>Garantías</li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>Soluciones B2B</h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.65rem", color: "var(--color-light-gray)", fontSize: "0.88rem" }}>
            <li>
              <Link href="/aliados" style={{ textDecoration: "none", color: "inherit" }}>
                Portal Aliado Experto
              </Link>
            </li>
            <li>
              <a href="#b2b-login" style={{ textDecoration: "none", color: "inherit" }}>
                Acceso B2B
              </a>
            </li>
            <li>
              <Link href="/cotizar" style={{ textDecoration: "none", color: "inherit" }}>
                Ventas Corporativas
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1.25rem" }}>Boletín Informativo</h4>
          <p style={{ color: "var(--color-light-gray)", fontSize: "0.88rem", marginBottom: "0.85rem" }}>
            Suscríbete y recibe ofertas exclusivas para tus proyectos.
          </p>
          <div style={{ display: "flex", maxWidth: "100%" }}>
            <input 
              type="email" 
              placeholder="Tu correo electrónico" 
              style={{ padding: "0.65rem 0.85rem", borderRadius: "var(--radius-md) 0 0 var(--radius-md)", border: "none", outline: "none", flex: 1, minWidth: 0, fontSize: "0.88rem" }}
            />
            <button style={{ background: "var(--color-secondary)", color: "white", padding: "0 1.25rem", borderRadius: "0 var(--radius-md) var(--radius-md) 0", fontWeight: 700, fontSize: "0.88rem", flexShrink: 0 }}>
              Enviar
            </button>
          </div>
        </div>

      </div>
      
      <div style={{ marginTop: "3rem", paddingTop: "1.75rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", textAlign: "center", paddingLeft: "1rem", paddingRight: "1rem" }}>
        <div>
          &copy; {new Date().getFullYear()} Distrielectricos E&D. <Link href="/login-corp" style={{ color: "inherit", textDecoration: "none" }}>Todos los derechos reservados.</Link>
        </div>
        
        <a 
          href="https://www.dctelematica.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="powered-link"
        >
          <span style={{ fontSize: "0.7rem", letterSpacing: "1px", fontWeight: 600 }}>POWERED BY</span>
          <img 
            src="/dc-telematica.png" 
            alt="DC Telematica" 
            style={{ height: "24px", objectFit: "contain" }} 
          />
        </a>
      </div>
    </footer>
  );
}
