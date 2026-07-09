import React, { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { BRUSH_BY_ID, ERASER_DEF, drawSegment, stampDab, floodFill, rgbToHex } from "@/components/grid/brushes";

export default function DrawCanvas({
  artworkSize, layers, activeId, canvasMapRef, tool, brush, color, size, opacity,
  zoom, pan, setZoom, setPan, onHistoryPush, onColorPick, onChange, version, spacePan,
}) {
  const containerRef = useRef(null);
  const displayRef = useRef(null);
  const dprRef = useRef(1);
  const drawing = useRef(false);
  const lastPt = useRef(null);
  const panning = useRef(false);
  const panStart = useRef(null);
  const [cursor, setCursor] = useState(null);

  const composite = useCallback(() => {
    const c = displayRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    const dpr = dprRef.current;
    const cw = c.clientWidth, ch = c.clientHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, artworkSize.w, artworkSize.h);
    for (const layer of layers) {
      if (!layer.visible) continue;
      const lc = canvasMapRef.current.get(layer.id);
      if (!lc) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(lc, 0, 0);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = 1 / zoom;
    ctx.strokeRect(0, 0, artworkSize.w, artworkSize.h);
    ctx.restore();
  }, [layers, pan, zoom, artworkSize, canvasMapRef]);

  const compositeRef = useRef(composite);
  useEffect(() => {
    compositeRef.current = composite;
  }, [composite]);

  useEffect(() => {
    composite();
  }, [composite, version, activeId]);

  useEffect(() => {
    const c = displayRef.current;
    const cont = containerRef.current;
    if (!c || !cont) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      const w = cont.clientWidth, h = cont.clientHeight;
      c.width = Math.max(1, Math.round(w * dpr));
      c.height = Math.max(1, Math.round(h * dpr));
      c.style.width = w + "px";
      c.style.height = h + "px";
      compositeRef.current();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cont);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(() => {
    const cont = containerRef.current;
    if (!cont) return;
    const cw = cont.clientWidth, ch = cont.clientHeight;
    const z = Math.max(0.05, Math.min((cw - 40) / artworkSize.w, (ch - 40) / artworkSize.h));
    setZoom(z);
    setPan({ x: (cw - artworkSize.w * z) / 2, y: (ch - artworkSize.h * z) / 2 });
  }, [artworkSize, setZoom, setPan]);

  useEffect(() => {
    const t = setTimeout(fit, 30);
    return () => clearTimeout(t);
  }, [fit]);

  useEffect(() => {
    const c = displayRef.current;
    if (!c) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nz = Math.max(0.05, Math.min(16, zoom * factor));
      const np = { x: px - (px - pan.x) * (nz / zoom), y: py - (py - pan.y) * (nz / zoom) };
      setZoom(nz);
      setPan(np);
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, [zoom, pan, setZoom, setPan]);

  const getPos = (e) => {
    const c = displayRef.current;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const toArt = (p) => ({ x: (p.x - pan.x) / zoom, y: (p.y - pan.y) / zoom });

  const onPointerDown = (e) => {
    const c = displayRef.current;
    const p = getPos(e);
    if (tool === "move" || spacePan) {
      panning.current = true;
      panStart.current = { p, pan };
      c.setPointerCapture(e.pointerId);
      return;
    }
    const a = toArt(p);
    const inBounds = a.x >= 0 && a.y >= 0 && a.x < artworkSize.w && a.y < artworkSize.h;
    if (tool === "eyedropper") {
      if (!inBounds) return;
      const ctx = c.getContext("2d");
      const dpr = dprRef.current;
      const data = ctx.getImageData(Math.floor(p.x * dpr), Math.floor(p.y * dpr), 1, 1).data;
      onColorPick(rgbToHex(data[0], data[1], data[2]));
      return;
    }
    if (!inBounds) return;
    const lc = canvasMapRef.current.get(activeId);
    if (!lc) return;
    const lctx = lc.getContext("2d");
    if (tool === "fill") {
      onHistoryPush();
      floodFill(lctx, artworkSize.w, artworkSize.h, Math.floor(a.x), Math.floor(a.y), color, 0.12);
      composite();
      onChange();
      return;
    }
    const def = tool === "eraser" ? ERASER_DEF : BRUSH_BY_ID[brush];
    if (!def) return;
    onHistoryPush();
    drawing.current = true;
    lastPt.current = a;
    stampDab(lctx, a.x, a.y, def, color, size, opacity);
    composite();
    c.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const p = getPos(e);
    setCursor(p);
    if (panning.current && panStart.current) {
      const dx = p.x - panStart.current.p.x;
      const dy = p.y - panStart.current.p.y;
      setPan({ x: panStart.current.pan.x + dx, y: panStart.current.pan.y + dy });
      return;
    }
    if (!drawing.current) return;
    const lc = canvasMapRef.current.get(activeId);
    if (!lc) return;
    const lctx = lc.getContext("2d");
    const def = tool === "eraser" ? ERASER_DEF : BRUSH_BY_ID[brush];
    if (!def) return;
    const a = toArt(p);
    drawSegment(lctx, lastPt.current, a, def, color, size, opacity);
    lastPt.current = a;
    composite();
  };

  const endStroke = (e) => {
    if (panning.current) {
      panning.current = false;
      panStart.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (e) { /* noop */ }
      return;
    }
    if (drawing.current) {
      drawing.current = false;
      lastPt.current = null;
      onChange();
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (e) { /* noop */ }
    }
  };

  const showCursor = (tool === "brush" || tool === "eraser") && cursor && !spacePan;
  const cursorSize = Math.max(4, size * zoom);
  const isPanCursor = tool === "move" || spacePan;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-muted">
      <canvas
        ref={displayRef}
        className="block touch-none"
        style={{ touchAction: "none", cursor: isPanCursor ? (panning.current ? "grabbing" : "grab") : "crosshair" }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        onPointerLeave={() => setCursor(null)}
      />

      {showCursor && (
        <div
          className="pointer-events-none absolute rounded-full border border-white mix-blend-difference"
          style={{ left: cursor.x - cursorSize / 2, top: cursor.y - cursorSize / 2, width: cursorSize, height: cursorSize }}
        />
      )}

      <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-1.5 py-1 backdrop-blur">
        <button onClick={() => setZoom((z) => Math.max(0.05, z / 1.2))} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-primary" aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="min-w-[3rem] text-center font-mono text-[10px] text-foreground/70">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(16, z * 1.2))} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-primary" aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={fit} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-primary" aria-label="Fit" title="Fit to view">
          <Maximize className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}