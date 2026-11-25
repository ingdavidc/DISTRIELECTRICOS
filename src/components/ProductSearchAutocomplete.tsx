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
  clearOnSelect?: boolean;
  loaderRight?: string;
}

export default function ProductSearchAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar producto...",
  className = "",
  style = {},
  autoFocus = false,
  showStock = false,
  clearOnSelect = false,
  loaderRight = "14px"
}: ProductSearchAutocompleteProps) {
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const touchMovedRef = useRef<boolean>(false);
  const suppressNextSearchRef = useRef<boolean>(false);
  const isFocusedRef = useRef<boolean>(autoFocus);
  const requestIdRef = useRef<number>(0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        isFocusedRef.current = false;
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
    // Cancel any pending debounce timer immediately on value change
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (suppressNextSearchRef.current) {
      suppressNextSearchRef.current = false;
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const trimmed = value.trim();
    if (trimmed.length < 2) {
      requestIdRef.current += 1;
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      setActiveIndex(-1);
      return;
    }

    // Do not pop open the dropdown if the user isn't actively focused in the input (e.g. URL init)
    if (!isFocusedRef.current) {
      return;
    }

    const currentReqId = ++requestIdRef.current;

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchProductsAutocomplete(trimmed);
        if (currentReqId !== requestIdRef.current) return;
        setResults(data);
        setActiveIndex(-1);
        setIsOpen(isFocusedRef.current && data.length > 0);
      } catch (err) {
        if (currentReqId === requestIdRef.current) {
          console.error("Search autocomplete error:", err);
        }
      } finally {
        if (currentReqId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  const handleSelect = (product: Product) => {
    requestIdRef.current += 1;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    suppressNextSearchRef.current = true;
    setIsOpen(false);
    setIsLoading(false);
    setActiveIndex(-1);
    onSelect(product);
    if (clearOnSelect) {
      onChange("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (isOpen && results.length > 0) {
        e.preventDefault();
        setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === "ArrowUp") {
      if (isOpen && results.length > 0) {
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
      }
    } else if (e.key === "Enter") {
      if (isOpen && results.length > 0) {
        e.preventDefault();
        const chosen = activeIndex >= 0 && activeIndex < results.length ? results[activeIndex] : results[0];
        handleSelect(chosen);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <input
        ref={inputRef}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          suppressNextSearchRef.current = false;
          isFocusedRef.current = true;
          onChange(e.target.value);
        }}
        onFocus={() => {
          isFocusedRef.current = true;
          if (results.length > 0 && value.trim().length >= 2) {
            setIsOpen(true);
          }
        }}
        onBlur={() => {
          // Small delay so pointer click/tap on dropdown completes first
          setTimeout(() => {
            if (document.activeElement !== inputRef.current) {
              isFocusedRef.current = false;
            }
          }, 150);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        style={style}
        autoFocus={autoFocus}
      />
      {isLoading && (
        <div style={{ position: "absolute", right: loaderRight, top: "50%", transform: "translateY(-50%)", zIndex: 3, pointerEvents: "none", display: "flex", alignItems: "center" }}>
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
          {results.map((product, index) => {
            const isHighlighted = index === activeIndex;
            return (
              <li 
                key={product.id}
                onClick={() => handleSelect(product)}
                onMouseDown={(e) => {
                  // Prevent input blur before click registers
                  e.preventDefault();
                }}
                onMouseEnter={() => setActiveIndex(index)}
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
                  minHeight: "52px",
                  backgroundColor: isHighlighted ? "var(--color-background)" : "transparent",
                  transition: "background-color 0.15s ease"
                }}
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
                  {product.imageUrl && !failedImages[product.id] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={() => setFailedImages(prev => ({ ...prev, [product.id]: true }))}
                    />
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
            );
          })}
        </ul>
      )}
    </div>
  );
}
