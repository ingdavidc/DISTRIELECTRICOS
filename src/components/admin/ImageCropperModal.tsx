"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Crop, RotateCw, Check, Loader2, RefreshCw, ZoomIn, Sparkles, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { fetchImageForCropping, saveCroppedImage } from "@/actions/image-search";

interface ImageCropperModalProps {
  isOpen: boolean;
  imageUrl?: string | null;
  onClose: () => void;
  onCropComplete: (newUrl: string) => void;
  title?: string;
}

interface CropBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export default function ImageCropperModal({
  isOpen,
  imageUrl,
  onClose,
  onCropComplete,
  title = "Recortar Imagen"
}: ImageCropperModalProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"free" | "1:1" | "4:5">("free");
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270

  // Crop box in percentages relative to the displayed image
  const [crop, setCrop] = useState<CropBox>({ x: 5, y: 5, width: 90, height: 90 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const dragRef = useRef<{
    handle: string | null;
    startX: number;
    startY: number;
    startCrop: CropBox;
    imgWidth: number;
    imgHeight: number;
  }>({
    handle: null,
    startX: 0,
    startY: 0,
    startCrop: { x: 5, y: 5, width: 90, height: 90 },
    imgWidth: 0,
    imgHeight: 0
  });

  // When modal opens or imageUrl changes, fetch image via server proxy to ensure no CORS canvas tainting
  useEffect(() => {
    if (!isOpen || !imageUrl) {
      setDataUrl(null);
      setRotation(0);
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
      return;
    }

    let isMounted = true;
    const loadImage = async () => {
      setIsLoadingImage(true);
      try {
        const res = await fetchImageForCropping(imageUrl);
        if (!isMounted) return;
        if (res.success && res.dataUrl) {
          setDataUrl(res.dataUrl);
        } else {
          // Fallback to direct url if proxy fails
          setDataUrl(imageUrl);
        }
      } catch (err) {
        console.error("Error loading image for cropper:", err);
        if (isMounted) setDataUrl(imageUrl);
      } finally {
        if (isMounted) setIsLoadingImage(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [isOpen, imageUrl]);

  // Adjust crop for aspect ratio
  const applyAspectRatio = (ratio: "free" | "1:1" | "4:5") => {
    setAspectRatio(ratio);
    if (!imgRef.current) return;

    const img = imgRef.current;
    const naturalRatio = img.naturalWidth / img.naturalHeight;

    if (ratio === "1:1") {
      if (naturalRatio >= 1) {
        // Landscape: height determines square
        const h = 85;
        const w = (h / naturalRatio);
        const x = (100 - w) / 2;
        const y = (100 - h) / 2;
        setCrop({ x: Math.max(2, x), y: Math.max(2, y), width: Math.min(96, w), height: h });
      } else {
        // Portrait: width determines square
        const w = 85;
        const h = (w * naturalRatio);
        const x = (100 - w) / 2;
        const y = (100 - h) / 2;
        setCrop({ x: Math.max(2, x), y: Math.max(2, y), width: w, height: Math.min(96, h) });
      }
    } else if (ratio === "4:5") {
      // 4:5 vertical
      const targetRatio = 4 / 5;
      const w = 80;
      const h = Math.min(95, (w / targetRatio) * naturalRatio);
      setCrop({ x: 10, y: 5, width: w, height: h });
    } else {
      // Free: default generous box
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
    }
  };

  // Quick preset: remove bottom watermark (e.g. 18% from bottom)
  const handleRemoveBottomWatermark = () => {
    setAspectRatio("free");
    setCrop(prev => {
      const newHeight = Math.max(30, Math.min(prev.height, 82));
      return {
        ...prev,
        y: Math.min(prev.y, 100 - newHeight),
        height: newHeight
      };
    });
    toast.success("Se excluyó la franja inferior (marca de agua)", { icon: "✂️", duration: 2500 });
  };

  // Reset crop to full
  const handleResetCrop = () => {
    setAspectRatio("free");
    setRotation(0);
    setCrop({ x: 2, y: 2, width: 96, height: 96 });
  };

  // Rotate 90deg
  const handleRotate = () => {
    setRotation(prev => ((prev + 90) % 360));
  };

  // Pointer drag logic
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();

    dragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
      imgWidth: rect.width,
      imgHeight: rect.height
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const { handle, startX, startY, startCrop, imgWidth, imgHeight } = dragRef.current;
      if (!handle || imgWidth === 0 || imgHeight === 0) return;

      const deltaX = ((moveEvent.clientX - startX) / imgWidth) * 100;
      const deltaY = ((moveEvent.clientY - startY) / imgHeight) * 100;

      let newCrop = { ...startCrop };

      if (handle === "move") {
        newCrop.x = Math.max(0, Math.min(100 - startCrop.width, startCrop.x + deltaX));
        newCrop.y = Math.max(0, Math.min(100 - startCrop.height, startCrop.y + deltaY));
      } else {
        // Resizing
        if (handle.includes("w")) {
          const right = startCrop.x + startCrop.width;
          const newX = Math.max(0, Math.min(right - 10, startCrop.x + deltaX));
          newCrop.x = newX;
          newCrop.width = right - newX;
        }
        if (handle.includes("e")) {
          newCrop.width = Math.max(10, Math.min(100 - startCrop.x, startCrop.width + deltaX));
        }
        if (handle.includes("n")) {
          const bottom = startCrop.y + startCrop.height;
          const newY = Math.max(0, Math.min(bottom - 10, startCrop.y + deltaY));
          newCrop.y = newY;
          newCrop.height = bottom - newY;
        }
        if (handle.includes("s")) {
          newCrop.height = Math.max(10, Math.min(100 - startCrop.y, startCrop.height + deltaY));
        }

        // Maintain aspect ratio if locked
        if (aspectRatio === "1:1" && imgRef.current) {
          const naturalRatio = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
          // In 1:1, pixel width === pixel height
          // (width% * imgWidth) === (height% * imgHeight)
          // height% = width% * (imgWidth / imgHeight)
          const pxRatio = imgWidth / imgHeight;
          if (handle === "e" || handle === "w") {
            const desiredHeight = newCrop.width * pxRatio;
            if (newCrop.y + desiredHeight <= 100) {
              newCrop.height = desiredHeight;
            } else {
              newCrop.height = 100 - newCrop.y;
              newCrop.width = newCrop.height / pxRatio;
            }
          } else if (handle === "s" || handle === "n") {
            const desiredWidth = newCrop.height / pxRatio;
            if (newCrop.x + desiredWidth <= 100) {
              newCrop.width = desiredWidth;
            } else {
              newCrop.width = 100 - newCrop.x;
              newCrop.height = newCrop.width * pxRatio;
            }
          }
        }
      }

      setCrop(newCrop);
    };

    const handlePointerUp = () => {
      dragRef.current.handle = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  // Perform crop and save
  const handleApplyCrop = async () => {
    if (!dataUrl) return;

    try {
      setIsProcessing(true);
      const tid = toast.loading("Recortando y optimizando imagen...");

      // 1. Create source image
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = dataUrl;

      await new Promise<void>((resolve, reject) => {
        if (img.complete) resolve();
        else {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("No se pudo cargar la imagen para procesar"));
        }
      });

      // 2. Setup intermediate canvas for rotation if needed
      let sourceCanvas: HTMLCanvasElement | HTMLImageElement = img;
      if (rotation !== 0) {
        const rotCanvas = document.createElement("canvas");
        const rad = (rotation * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        rotCanvas.width = img.naturalWidth * cos + img.naturalHeight * sin;
        rotCanvas.height = img.naturalWidth * sin + img.naturalHeight * cos;

        const rotCtx = rotCanvas.getContext("2d");
        if (rotCtx) {
          rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
          rotCtx.rotate(rad);
          rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
          sourceCanvas = rotCanvas;
        }
      }

      const srcW = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalWidth : sourceCanvas.width;
      const srcH = sourceCanvas instanceof HTMLImageElement ? sourceCanvas.naturalHeight : sourceCanvas.height;

      // 3. Calculate crop coordinates on the source
      const sx = (crop.x / 100) * srcW;
      const sy = (crop.y / 100) * srcH;
      const sw = (crop.width / 100) * srcW;
      const sh = (crop.height / 100) * srcH;

      if (sw <= 0 || sh <= 0) {
        throw new Error("Área de recorte inválida");
      }

      // 4. Output canvas
      const outCanvas = document.createElement("canvas");
      // Cap at 1000px max for speed & <100KB compression
      const maxDim = 1000;
      let targetW = sw;
      let targetH = sh;
      if (targetW > maxDim || targetH > maxDim) {
        if (targetW >= targetH) {
          targetH = (targetH / targetW) * maxDim;
          targetW = maxDim;
        } else {
          targetW = (targetW / targetH) * maxDim;
          targetH = maxDim;
        }
      }

      outCanvas.width = Math.round(targetW);
      outCanvas.height = Math.round(targetH);

      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) throw new Error("No se pudo inicializar contexto 2D");

      // Smooth scaling
      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = "high";

      // White background for PNG transparency if converted to JPEG
      outCtx.fillStyle = "#FFFFFF";
      outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);

      // Draw cropped area
      outCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, outCanvas.width, outCanvas.height);

      // 5. Convert to JPEG base64 (quality 0.88 stays comfortably under 100KB)
      const croppedBase64 = outCanvas.toDataURL("image/jpeg", 0.88);

      // 6. Save permanently to Supabase via server action
      const saveRes = await saveCroppedImage(croppedBase64);
      if (!saveRes.success || !saveRes.url) {
        throw new Error(saveRes.error || "Error al subir imagen recortada a Supabase");
      }

      toast.success("¡Imagen recortada y guardada con éxito!", { id: tid });
      onCropComplete(saveRes.url);
      onClose();
    } catch (err: any) {
      console.error("Error al aplicar recorte:", err);
      toast.error(err.message || "Error al recortar imagen");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: "1rem"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "1rem",
          width: "100%",
          maxWidth: "760px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
          border: "1px solid var(--color-border)"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#f8fafc"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "rgba(243, 148, 35, 0.15)",
                color: "var(--color-secondary, #f39423)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Crop size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--color-primary, #203562)" }}>
                {title}
              </h3>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                Arrastra los bordes para quitar marcas de agua o logos antes de guardar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              padding: "0.4rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div
          style={{
            padding: "0.65rem 1.25rem",
            background: "#ffffff",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.6rem"
          }}
        >
          {/* Proportions */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-muted)" }}>
              Proporción:
            </span>
            <button
              type="button"
              onClick={() => applyAspectRatio("free")}
              className="btn"
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.75rem",
                borderRadius: "6px",
                background: aspectRatio === "free" ? "var(--color-primary, #203562)" : "#f1f5f9",
                color: aspectRatio === "free" ? "#fff" : "var(--color-text)",
                border: "none",
                fontWeight: 600
              }}
            >
              Libre
            </button>
            <button
              type="button"
              onClick={() => applyAspectRatio("1:1")}
              className="btn"
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.75rem",
                borderRadius: "6px",
                background: aspectRatio === "1:1" ? "var(--color-primary, #203562)" : "#f1f5f9",
                color: aspectRatio === "1:1" ? "#fff" : "var(--color-text)",
                border: "none",
                fontWeight: 600
              }}
            >
              1:1 Cuadrado
            </button>
            <button
              type="button"
              onClick={() => applyAspectRatio("4:5")}
              className="btn"
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.75rem",
                borderRadius: "6px",
                background: aspectRatio === "4:5" ? "var(--color-primary, #203562)" : "#f1f5f9",
                color: aspectRatio === "4:5" ? "#fff" : "var(--color-text)",
                border: "none",
                fontWeight: 600
              }}
            >
              4:5 Catálogo
            </button>
          </div>

          {/* Quick Watermark Removal & Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <button
              type="button"
              onClick={handleRemoveBottomWatermark}
              className="btn"
              title="Excluye el 18% inferior donde suelen estar los logos y marcas"
              style={{
                padding: "0.25rem 0.65rem",
                fontSize: "0.75rem",
                borderRadius: "6px",
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.3rem"
              }}
            >
              ✂️ Quitar Marca Inferior
            </button>
            <button
              type="button"
              onClick={handleRotate}
              className="btn"
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                borderRadius: "6px",
                background: "#f1f5f9",
                color: "var(--color-text)",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem"
              }}
            >
              <RotateCw size={13} /> Girar 90°
            </button>
            <button
              type="button"
              onClick={handleResetCrop}
              className="btn"
              style={{
                padding: "0.25rem 0.5rem",
                fontSize: "0.75rem",
                borderRadius: "6px",
                background: "#f1f5f9",
                color: "var(--color-text)",
                border: "none"
              }}
            >
              Restablecer
            </button>
          </div>
        </div>

        {/* Workspace Canvas / Viewport */}
        <div
          style={{
            flex: 1,
            minHeight: "360px",
            maxHeight: "58vh",
            background: "#0f172a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            position: "relative",
            userSelect: "none",
            touchAction: "none"
          }}
          ref={containerRef}
        >
          {isLoadingImage ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", color: "#94a3b8" }}>
              <Loader2 size={32} className="animate-spin" color="var(--color-secondary, #f39423)" />
              <span style={{ fontSize: "0.85rem" }}>Cargando imagen de forma segura...</span>
            </div>
          ) : dataUrl ? (
            <div
              style={{
                position: "relative",
                display: "inline-block",
                maxWidth: "92%",
                maxHeight: "92%",
                boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
              }}
            >
              {/* Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={dataUrl}
                alt="Para recortar"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "54vh",
                  objectFit: "contain",
                  transform: rotation ? `rotate(${rotation}deg)` : undefined,
                  transition: "transform 0.2s ease"
                }}
                draggable={false}
              />

              {/* Dark Overlays Outside Crop Area */}
              {/* Top mask */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: `${crop.y}%`,
                  background: "rgba(0, 0, 0, 0.65)",
                  pointerEvents: "none"
                }}
              />
              {/* Bottom mask */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${100 - crop.y - crop.height}%`,
                  background: "rgba(0, 0, 0, 0.65)",
                  pointerEvents: "none"
                }}
              />
              {/* Left mask */}
              <div
                style={{
                  position: "absolute",
                  top: `${crop.y}%`,
                  bottom: `${100 - crop.y - crop.height}%`,
                  left: 0,
                  width: `${crop.x}%`,
                  background: "rgba(0, 0, 0, 0.65)",
                  pointerEvents: "none"
                }}
              />
              {/* Right mask */}
              <div
                style={{
                  position: "absolute",
                  top: `${crop.y}%`,
                  bottom: `${100 - crop.y - crop.height}%`,
                  right: 0,
                  width: `${100 - crop.x - crop.width}%`,
                  background: "rgba(0, 0, 0, 0.65)",
                  pointerEvents: "none"
                }}
              />

              {/* Active Crop Frame */}
              <div
                style={{
                  position: "absolute",
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                  border: "2px solid #f39423",
                  boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.6)",
                  boxSizing: "border-box",
                  cursor: "move"
                }}
                onPointerDown={(e) => handlePointerDown(e, "move")}
              >
                {/* 3x3 Grid Guidelines */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gridTemplateRows: "1fr 1fr 1fr"
                  }}
                >
                  <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                  <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                  <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                  <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                  <div style={{ borderRight: "1px dashed rgba(255,255,255,0.4)", borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                  <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.4)" }} />
                </div>

                {/* Corner Handles */}
                {/* NW */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "nw")}
                  style={{
                    position: "absolute",
                    top: "-6px",
                    left: "-6px",
                    width: "12px",
                    height: "12px",
                    background: "#f39423",
                    border: "2px solid #fff",
                    borderRadius: "2px",
                    cursor: "nw-resize"
                  }}
                />
                {/* NE */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "ne")}
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-6px",
                    width: "12px",
                    height: "12px",
                    background: "#f39423",
                    border: "2px solid #fff",
                    borderRadius: "2px",
                    cursor: "ne-resize"
                  }}
                />
                {/* SW */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "sw")}
                  style={{
                    position: "absolute",
                    bottom: "-6px",
                    left: "-6px",
                    width: "12px",
                    height: "12px",
                    background: "#f39423",
                    border: "2px solid #fff",
                    borderRadius: "2px",
                    cursor: "sw-resize"
                  }}
                />
                {/* SE */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "se")}
                  style={{
                    position: "absolute",
                    bottom: "-6px",
                    right: "-6px",
                    width: "12px",
                    height: "12px",
                    background: "#f39423",
                    border: "2px solid #fff",
                    borderRadius: "2px",
                    cursor: "se-resize"
                  }}
                />

                {/* Edge Handles */}
                {/* N */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "n")}
                  style={{
                    position: "absolute",
                    top: "-5px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "18px",
                    height: "8px",
                    background: "#f39423",
                    border: "1.5px solid #fff",
                    borderRadius: "2px",
                    cursor: "n-resize"
                  }}
                />
                {/* S (crucial for trimming bottom watermark!) */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "s")}
                  title="Arrastra hacia arriba para quitar marca de agua inferior"
                  style={{
                    position: "absolute",
                    bottom: "-5px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "26px",
                    height: "10px",
                    background: "#f39423",
                    border: "2px solid #fff",
                    borderRadius: "3px",
                    cursor: "s-resize",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.4)"
                  }}
                />
                {/* W */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "w")}
                  style={{
                    position: "absolute",
                    left: "-5px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "8px",
                    height: "18px",
                    background: "#f39423",
                    border: "1.5px solid #fff",
                    borderRadius: "2px",
                    cursor: "w-resize"
                  }}
                />
                {/* E */}
                <div
                  onPointerDown={(e) => handlePointerDown(e, "e")}
                  style={{
                    position: "absolute",
                    right: "-5px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "8px",
                    height: "18px",
                    background: "#f39423",
                    border: "1.5px solid #fff",
                    borderRadius: "2px",
                    cursor: "e-resize"
                  }}
                />
              </div>
            </div>
          ) : (
            <div style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={20} />
              <span>No se pudo cargar la imagen para recorte</span>
            </div>
          )}
        </div>

        {/* Footer info & buttons */}
        <div
          style={{
            padding: "0.85rem 1.25rem",
            background: "#f8fafc",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem"
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
            💡 <strong>Tip:</strong> Sube el borde inferior naranja para cortar logos o textos en las esquinas.
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn btn-outline"
              style={{ padding: "0.45rem 1rem", fontSize: "0.85rem" }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing || !dataUrl || isLoadingImage}
              className="btn btn-primary"
              style={{
                padding: "0.45rem 1.25rem",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "var(--color-primary, #203562)",
                color: "#fff",
                fontWeight: 600,
                opacity: isProcessing || !dataUrl || isLoadingImage ? 0.6 : 1
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Guardando...
                </>
              ) : (
                <>
                  <Check size={16} /> Aplicar Recorte
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
