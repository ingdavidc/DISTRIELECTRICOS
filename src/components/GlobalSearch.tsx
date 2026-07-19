"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, Users, Truck, ShoppingCart, Loader2, ArrowRight, X } from "lucide-react";
import { globalSearch } from "@/actions/search";
import { useRouter } from "next/navigation";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setIsLoading(true);
        const res = await globalSearch(query);
        setResults(res);
        setIsLoading(false);
      } else {
        setResults(null);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (url: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(url);
  };

  const hasResults = results && (
    results.shortcuts?.length > 0 ||
    results.products?.length > 0 ||
    results.customers?.length > 0 ||
    results.suppliers?.length > 0 ||
    results.orders?.length > 0
  );

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
      <div style={{ position: "relative", width: "100%" }}>
        <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
        <input 
          type="text" 
          placeholder="Buscar atajos, productos, clientes..." 
          className="input" 
          style={{ paddingLeft: "35px", paddingRight: "35px", borderRadius: "9999px", background: "var(--color-background)", width: "100%" }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
        />
        {query && (
          <button 
            onClick={() => { setQuery(""); setIsOpen(false); setResults(null); }}
            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && query.trim().length >= 2 && (
        <div style={{ 
          position: "absolute", 
          top: "100%", 
          left: 0, 
          right: 0, 
          marginTop: "0.5rem",
          background: "white", 
          borderRadius: "var(--radius-lg)", 
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)", 
          border: "1px solid var(--color-border)",
          maxHeight: "500px",
          overflowY: "auto",
          zIndex: 50,
          padding: "0.5rem"
        }}>
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}

          {!isLoading && !hasResults && results && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              No se encontraron resultados para "{query}"
            </div>
          )}

          {!isLoading && hasResults && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              
              {/* Shortcuts */}
              {results.shortcuts?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 0.5rem 0.5rem 0.5rem" }}>Atajos</div>
                  {results.shortcuts.map((s: any, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => handleNavigate(s.url)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <ArrowRight size={16} color="var(--color-primary)" />
                        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{s.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Products */}
              {results.products?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 0.5rem 0.5rem 0.5rem" }}>Productos</div>
                  {results.products.map((p: any) => (
                    <button 
                      key={p.id} 
                      onClick={() => handleNavigate(`/inventory`)}
                      style={{ display: "flex", alignItems: "center", width: "100%", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <Package size={16} color="var(--color-text-muted)" style={{ minWidth: "16px", marginRight: "0.5rem" }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>SKU: {p.sku} • Stock: {p.stock}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Customers */}
              {results.customers?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 0.5rem 0.5rem 0.5rem" }}>Clientes</div>
                  {results.customers.map((c: any) => (
                    <button 
                      key={c.id} 
                      onClick={() => handleNavigate(`/customers`)}
                      style={{ display: "flex", alignItems: "center", width: "100%", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <Users size={16} color="var(--color-text-muted)" style={{ minWidth: "16px", marginRight: "0.5rem" }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>ID: {c.identification}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Suppliers */}
              {results.suppliers?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 0.5rem 0.5rem 0.5rem" }}>Proveedores</div>
                  {results.suppliers.map((s: any) => (
                    <button 
                      key={s.id} 
                      onClick={() => handleNavigate(`/suppliers`)}
                      style={{ display: "flex", alignItems: "center", width: "100%", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <Truck size={16} color="var(--color-text-muted)" style={{ minWidth: "16px", marginRight: "0.5rem" }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>NIT: {s.nit || "N/A"}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Orders */}
              {results.orders?.length > 0 && (
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", padding: "0 0.5rem 0.5rem 0.5rem" }}>Órdenes Recientes</div>
                  {results.orders.map((o: any) => (
                    <button 
                      key={o.id} 
                      onClick={() => handleNavigate(`/pos?orderId=${o.id}`)}
                      style={{ display: "flex", alignItems: "center", width: "100%", padding: "0.5rem", borderRadius: "var(--radius-md)", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.2s" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-background)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                    >
                      <ShoppingCart size={16} color="var(--color-text-muted)" style={{ minWidth: "16px", marginRight: "0.5rem" }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Orden #{o.id.split("-")[0]}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{o.customer?.name || "Consumidor Final"} • ${o.totalAmount.toLocaleString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
}
