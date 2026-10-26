"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchProductsAutocomplete } from "@/actions/search";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
  unit: string;
  imageUrl: string | null;
  cost: number;
  expertDiscount: number;
  volumeDiscount: number;
  corporateDiscount: number;
}

interface ProductSearchAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (product: Product) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
  showStock?: boolean;
}

export default function ProductSearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar producto...",
  className = "",
  style = {},
  autoFocus = false,
  showStock = false
}: ProductSearchAutocompleteProps) {
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const touchMovedRef = useRef<boolean>(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (value.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchProductsAutocomplete(value);
        setResults(data);
        setIsOpen(data.length > 0);
      } catch (err) {
        console.error("Search autocomplete error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = (product: Product) => {
    onSelect(product);
    setIsOpen(false);
    onChange(""); 
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        placeholder={placeholder}
        className={className}
        style={style}
        autoFocus={autoFocus}
      />
      {isLoading && (
        <div style={{ position: "absolute", right: "75px", top: "50%", transform: "translateY(-50%)", zIndex: 3, pointerEvents: "none" }}>
          <Loader2 size={18} className="spin" color="var(--color-secondary)" />
        </div>
      )}
      
      {isOpen && (
        <ul 
          className="search-autocomplete-dropdown"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "white",
            border: "1px solid var(--color-border)",
            borderRadius: "0.75rem",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            maxHeight: "min(360px, 60vh)",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            zIndex: 1000,
            margin: 0,
            padding: "0.25rem 0",
            listStyle: "none"
          }}
        >
          {results.map((product) => (
            <li 
              key={product.id}
              onClick={() => handleSelect(product)}
              onMouseDown={(e) => {
                // Prevent input blur before click registers
                e.preventDefault();
                handleSelect(product);
              }}
              onTouchStart={() => {
                touchMovedRef.current = false;
              }}
              onTouchMove={() => {
                touchMovedRef.current = true;
              }}
              onTouchEnd={(e) => {
                if (!touchMovedRef.current) {
                  e.preventDefault();
                  handleSelect(product);
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0.65rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid var(--color-border)",
                gap: "0.75rem",
                minHeight: "52px"
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--color-background)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{
                width: "42px",
                height: "42px",
                flexShrink: 0,
                borderRadius: "6px",
                backgroundColor: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "1px solid #e5e7eb"
              }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <ImageIcon size={20} color="var(--color-text-muted)" />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", lineHeight: "1.25", marginBottom: "0.2rem", wordBreak: "break-word", color: "var(--color-primary)" }}>
                  {product.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", gap: "0.5rem" }}>
                  <span>SKU: {product.sku}</span>
                  {showStock && (
                    <>
                      <span>|</span>
                      <span style={{ color: product.stock > 0 ? "var(--color-success)" : "var(--color-danger)", fontWeight: 600 }}>
                        Stock: {product.stock}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--color-primary)", flexShrink: 0 }}>
                ${product.price.toLocaleString('de-DE')}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
