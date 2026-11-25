"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Crop, RotateCw, Check, Loader2, AlertCircle } from "lucide-react";
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
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"free" | "1:1" | "4:5">("free");

  // Crop box in percentages relative to the displayed image
  const [crop, setCrop] = useState<CropBox>({ x: 5, y: 5, width: 90, height: 90 });

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

  // Handle Escape key cleanly inside Cropper without closing parent modals
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (!isProcessing) onClose();
      }
    };
    window.addEventListener("keydown", handleEsc, true);
    return () => window.removeEventListener("keydown", handleEsc, true);
  }, [isOpen, isProcessing, onClose]);

  // Fetch image via server proxy when modal opens to avoid CORS tainted canvas
  useEffect(() => {
    if (!isOpen || !imageUrl) {
      setDataUrl(null);
      setOriginalDataUrl(null);
      setAspectRatio("free");
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
      return;
    }

    let isMounted = true;
    const loadImage = async () => {
      setIsLoadingImage(true);
      try {
        const res = await fetchImageForCropping(imageUrl);
        if (!isMounted) return;
        const safeUrl = res.success && res.dataUrl ? res.dataUrl : imageUrl;
        setOriginalDataUrl(safeUrl);
        setDataUrl(safeUrl);
      } catch (err) {
        console.error("Error loading image for cropper:", err);
        if (isMounted) {
          setOriginalDataUrl(imageUrl);
          setDataUrl(imageUrl);
        }
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
    if (!imgRef.current || !imgRef.current.naturalWidth || !imgRef.current.naturalHeight) return;

    const img = imgRef.current;
    const naturalRatio = img.naturalWidth / img.naturalHeight;

    if (ratio === "1:1") {
      if (naturalRatio >= 1) {
        const h = 85;
        const w = h / naturalRatio;
        setCrop({ x: Math.max(2, (100 - w) / 2), y: Math.max(2, (100 - h) / 2), width: Math.min(96, w), height: h });
      } else {
        const w = 85;
        const h = w * naturalRatio;
        setCrop({ x: Math.max(2, (100 - w) / 2), y: Math.max(2, (100 - h) / 2), width: w, height: Math.min(96, h) });
      }
    } else if (ratio === "4:5") {
      const targetRatio = 4 / 5;
      let w = 80;
      let h = (w / targetRatio) * naturalRatio;
      if (h > 92) {
        h = 92;
        w = (h / naturalRatio) * targetRatio;
      }
      setCrop({ x: (100 - w) / 2, y: (100 - h) / 2, width: w, height: h });
    } else {
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
    }
  };

  // Quick preset: remove bottom watermark (~18% from bottom)
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

  // Reset crop & rotation back to original image
  const handleResetCrop = () => {
    setAspectRatio("free");
    if (originalDataUrl) setDataUrl(originalDataUrl);
    setCrop({ x: 2, y: 2, width: 96, height: 96 });
  };

  // Rotate pixels 90deg clockwise directly on a canvas so overlay & bounding box always stay pixel-exact
  const handleRotate = async () => {
    if (!dataUrl || isProcessing) return;
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        if (img.complete) resolve();
        else {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("No se pudo rotar la imagen"));
        }
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalHeight;
      canvas.height = img.naturalWidth;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      const rotatedUrl = canvas.toDataURL("image/png");
      setDataUrl(rotatedUrl);
      setAspectRatio("free");
      setCrop({ x: 5, y: 5, width: 90, height: 90 });
    } catch (err) {
      console.error("Rotate error:", err);
      toast.error("No se pudo girar esta imagen");
    }
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

      const newCrop = { ...startCrop };

      if (handle === "move") {
        newCrop.x = Math.max(0, Math.min(100 - startCrop.width, startCrop.x + deltaX));
        newCrop.y = Math.max(0, Math.min(100 - startCrop.height, startCrop.y + deltaY));
      } else {
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

        // Maintain locked aspect ratio cleanly
        if (aspectRatio !== "free") {
          const targetPxRatio = aspectRatio === "1:1" ? 1 : 4 / 5;
          // pxWidth / pxHeight = targetPxRatio => (width% * imgWidth) / (height% * imgHeight) = targetPxRatio
          // height% = width% * (imgWidth / imgHeight) / targetPxRatio
          const factor = (imgWidth / imgHeight) / targetPxRatio;

          if (handle === "n" || handle === "s") {
            const desiredW = newCrop.height / factor;
            if (newCrop.x + desiredW <= 100) {
              newCrop.width = desiredW;
            } else {
              newCrop.width = 100 - newCrop.x;
              newCrop.height = newCrop.width * factor;
            }
          } else {
            const desiredH = newCrop.width * factor;
            if (handle.includes("n")) {
              const bottom = startCrop.y + startCrop.height;
              if (bottom - desiredH >= 0) {
                newCrop.height = desiredH;
                newCrop.y = bottom - desiredH;
              } else {
                newCrop.y = 0;
                newCrop.height = bottom;
                const adjustedW = newCrop.height / factor;
                if (handle.includes("w")) {
                  newCrop.x = (startCrop.x + startCrop.width) - adjustedW;
                }
                newCrop.width = adjustedW;
              }
            } else {
              if (newCrop.y + desiredH <= 100) {
                newCrop.height = desiredH;
              } else {
                newCrop.height = 100 - newCrop.y;
                const adjustedW = newCrop.height / factor;
                if (handle.includes("w")) {
                  newCrop.x = (startCrop.x + startCrop.width) - adjustedW;
                }
                newCrop.width = adjustedW;
              }
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

  // Perform crop and upload
  const handleApplyCrop = async () => {
    if (!dataUrl) return;

    try {
      setIsProcessing(true);
      const tid = toast.loading("Recortando y optimizando imagen...");

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

      const srcW = img.naturalWidth;
      const srcH = img.naturalHeight;

      const sx = (crop.x / 100) * srcW;
      const sy = (crop.y / 100) * srcH;
      const sw = (crop.width / 100) * srcW;
      const sh = (crop.height / 100) * srcH;

      if (sw <= 0 || sh <= 0) {
        throw new Error("Área de recorte inválida");
      }

      const outCanvas = document.createElement("canvas");
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

      outCanvas.width = Math.max(1, Math.round(targetW));
      outCanvas.height = Math.max(1, Math.round(targetH));

      const outCtx = outCanvas.getContext("2d");
      if (!outCtx) throw new Error("No se pudo inicializar contexto 2D");

      outCtx.imageSmoothingEnabled = true;
      outCtx.imageSmoothingQuality = "high";

      // White background for PNG transparency converted to JPEG
      outCtx.fillStyle = "#FFFFFF";
      outCtx.fillRect(0, 0, outCanvas.width, outCanvas.height);
      outCtx.drawImage(img, sx, sy, sw, sh, 0, 0, outCanvas.width, outCanvas.height);

      const croppedBase64 = outCanvas.toDataURL("image/jpeg", 0.88);
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
                color: aspectRatio === "free" ? "#fff" : "var(--color-text-main)",
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
                color: aspectRatio === "1:1" ? "#fff" : "var(--color-text-main)",
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
                color: aspectRatio === "4:5" ? "#fff" : "var(--color-text-main)",
                border: "none",
                fontWeight: 600
              }}
            >
              4:5 Catálogo
            </button>
          </div>

          {/* Quick Watermark Removal & Tools */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
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
                color: "var(--color-text-main)",
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
                color: "var(--color-text-main)",
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
            minHeight: "340px",
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={dataUrl}
                alt="Para recortar"
                style={{
                  display: "block",
                  maxWidth: "100%",
                  maxHeight: "54vh",
                  objectFit: "contain"
                }}
                draggable={false}
              />

              {/* Dark Overlays Outside Crop Area */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: `${crop.y}%`, background: "rgba(0, 0, 0, 0.65)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: `${100 - crop.y - crop.height}%`, background: "rgba(0, 0, 0, 0.65)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: `${crop.y}%`, bottom: `${100 - crop.y - crop.height}%`, left: 0, width: `${crop.x}%`, background: "rgba(0, 0, 0, 0.65)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", top: `${crop.y}%`, bottom: `${100 - crop.y - crop.height}%`, right: 0, width: `${100 - crop.x - crop.width}%`, background: "rgba(0, 0, 0, 0.65)", pointerEvents: "none" }} />

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
                <div onPointerDown={(e) => handlePointerDown(e, "nw")} style={{ position: "absolute", top: "-6px", left: "-6px", width: "12px", height: "12px", background: "#f39423", border: "2px solid #fff", borderRadius: "2px", cursor: "nw-resize" }} />
                <div onPointerDown={(e) => handlePointerDown(e, "ne")} style={{ position: "absolute", top: "-6px", right: "-6px", width: "12px", height: "12px", background: "#f39423", border: "2px solid #fff", borderRadius: "2px", cursor: "ne-resize" }} />
                <div onPointerDown={(e) => handlePointerDown(e, "sw")} style={{ position: "absolute", bottom: "-6px", left: "-6px", width: "12px", height: "12px", background: "#f39423", border: "2px solid #fff", borderRadius: "2px", cursor: "sw-resize" }} />
                <div onPointerDown={(e) => handlePointerDown(e, "se")} style={{ position: "absolute", bottom: "-6px", right: "-6px", width: "12px", height: "12px", background: "#f39423", border: "2px solid #fff", borderRadius: "2px", cursor: "se-resize" }} />

                {/* Edge Handles */}
                <div onPointerDown={(e) => handlePointerDown(e, "n")} style={{ position: "absolute", top: "-5px", left: "50%", transform: "translateX(-50%)", width: "18px", height: "8px", background: "#f39423", border: "1.5px solid #fff", borderRadius: "2px", cursor: "n-resize" }} />
                <div onPointerDown={(e) => handlePointerDown(e, "s")} title="Arrastra hacia arriba para quitar marca de agua inferior" style={{ position: "absolute", bottom: "-5px", left: "50%", transform: "translateX(-50%)", width: "26px", height: "10px", background: "#f39423", border: "2px solid #fff", borderRadius: "3px", cursor: "s-resize", boxShadow: "0 2px 4px rgba(0,0,0,0.4)" }} />
                <div onPointerDown={(e) => handlePointerDown(e, "w")} style={{ position: "absolute", left: "-5px", top: "50%", transform: "translateY(-50%)", width: "8px", height: "18px", background: "#f39423", border: "1.5px solid #fff", borderRadius: "2px", cursor: "w-resize" }} />
                <div onPointerDown={(e) => handlePointerDown(e, "e")} style={{ position: "absolute", right: "-5px", top: "50%", transform: "translateY(-50%)", width: "8px", height: "18px", background: "#f39423", border: "1.5px solid #fff", borderRadius: "2px", cursor: "e-resize" }} />
              </div>
            </div>
          ) : (
            <div style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <AlertCircle size={20} />
              <span>No se pudo cargar la imagen para recorte</span>
            </div>
          )}
        </div>

        {/* Footer */}
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
