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
  const requestIdRef = useRef<number>(0);

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

  // Debounce search with race condition guard
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      requestIdRef.current += 1;
      setResults(null);
      setIsLoading(false);
      return;
    }

    const reqId = ++requestIdRef.current;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await globalSearch(trimmed);
        if (reqId !== requestIdRef.current) return;
        setResults(res);
      } catch (err) {
        if (reqId === requestIdRef.current) {
          console.error("GlobalSearch error:", err);
        }
      } finally {
        if (reqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (url: string) => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
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
    <div ref={wrapperRef} style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
      <div style={{ position: "relative", width: "100%" }}>
        <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none", zIndex: 2 }} />
        <input 
          type="text" 
          autoComplete="off"
          placeholder="Buscar atajos, productos, clientes..." 
          className="input" 
          style={{ paddingLeft: "38px", paddingRight: query ? "36px" : "14px", borderRadius: "9999px", background: "var(--color-background)", width: "100%" }}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setIsOpen(false);
          }}
        />
        {query && (
          <button 
            type="button"
            aria-label="Limpiar búsqueda global"
            onClick={() => { setQuery(""); setIsOpen(false); setResults(null); }}
            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "2px", zIndex: 2 }}
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
          boxShadow: "0 12px 28px rgba(0,0,0,0.14)", 
          border: "1px solid var(--color-border)",
          maxHeight: "500px",
          overflowY: "auto",
          zIndex: 1100,
          padding: "0.5rem"
        }}>
          {isLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              <Loader2 className="animate-spin" size={24} />
            </div>
          )}

          {!isLoading && !hasResults && results && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-muted)" }}>
              No se encontraron resultados para &quot;{query}&quot;
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
                      type="button"
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
                      type="button"
                      onClick={() => handleNavigate(`/inventory?search=${encodeURIComponent(p.sku || p.name)}`)}
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
                      type="button"
                      onClick={() => handleNavigate(`/customers?search=${encodeURIComponent(c.identification || c.name)}`)}
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
                      type="button"
                      onClick={() => handleNavigate(`/suppliers?search=${encodeURIComponent(s.nit || s.name)}`)}
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
                      type="button"
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
