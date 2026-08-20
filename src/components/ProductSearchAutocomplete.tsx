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
}

export default function ProductSearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar producto...",
  className = "",
  style = {},
  autoFocus = false
}: ProductSearchAutocompleteProps) {
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      const data = await searchProductsAutocomplete(value);
      setResults(data);
      setIsOpen(data.length > 0);
      setIsLoading(false);
    }, 300);

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
        <div style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)" }}>
          <Loader2 size={16} className="spin" color="var(--color-text-muted)" />
        </div>
      )}
      
      {isOpen && (
        <ul style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          backgroundColor: "white",
          border: "1px solid var(--color-border)",
          borderRadius: "0.5rem",
          boxShadow: "var(--shadow-md)",
          maxHeight: "300px",
          overflowY: "auto",
          zIndex: 50,
          margin: 0,
          padding: 0,
          listStyle: "none",
          marginTop: "0.25rem"
        }}>
          {results.map((product) => (
            <li 
              key={product.id}
              onClick={() => handleSelect(product)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid var(--color-border)",
                gap: "1rem"
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "var(--color-background)")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <div style={{
                width: "40px",
                height: "40px",
                flexShrink: 0,
                borderRadius: "4px",
                backgroundColor: "var(--color-background)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden"
              }}>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <ImageIcon size={20} color="var(--color-text-muted)" />
                )}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {product.name}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", gap: "0.5rem" }}>
                  <span>SKU: {product.sku}</span>
                  <span>|</span>
                  <span>Stock: {product.stock}</span>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--color-primary)" }}>
                ${product.price.toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
