import React, { useEffect, useRef, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { BRUSH_BY_ID, ERASER_DEF, drawSegment, stampDab, floodFill, rgbToHex } from "@/components/grid/brushes";

const SHAPES = new Set(["line", "rect", "ellipse"]);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const midPt = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function strokeShape(ctx, type, x0, y0, x1, y1, color, size, opacity) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  if (type === "line") { ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); }
  else if (type === "rect") { ctx.rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0)); }
  else if (type === "ellipse") {
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const rx = Math.max(0.5, Math.abs(x1 - x0) / 2), ry = Math.max(0.5, Math.abs(y1 - y0) / 2);
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  }
  ctx.stroke();
  ctx.restore();
}

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
  const pointers = useRef(new Map());
  const pinching = useRef(false);
  const pinchStart = useRef(null);
  const shapeStart = useRef(null);
  const [cursor, setCursor] = useState(null);
  const [textEditing, setTextEditing] = useState(false);
  const textEditingRef = useRef(false);
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });
  const [textArt, setTextArt] = useState({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState("");

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
  useEffect(() => { compositeRef.current = composite; }, [composite]);

  useEffect(() => { composite(); }, [composite, version, activeId]);

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
    pointers.current.set(e.pointerId, p);
    // Two fingers → pinch-zoom + two-finger pan (cancels any in-progress stroke).
    if (pointers.current.size === 2) {
      drawing.current = false; lastPt.current = null; panning.current = false; shapeStart.current = null;
      const pts = [...pointers.current.values()];
      const m0 = midPt(pts[0], pts[1]);
      pinchStart.current = { dist: dist(pts[0], pts[1]), zoom, pan, art0: { x: (m0.x - pan.x) / zoom, y: (m0.y - pan.y) / zoom } };
      pinching.current = true;
      try { c.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    if (tool === "move" || spacePan) {
      panning.current = true; panStart.current = { p, pan };
      try { c.setPointerCapture(e.pointerId); } catch {}
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
    if (tool === "text") {
      if (!inBounds) return;
      textEditingRef.current = true; setTextEditing(true);
      setTextArt(a); setTextPos(p); setTextValue("");
      return;
    }
    if (!inBounds) return;
    const lc = canvasMapRef.current.get(activeId);
    if (!lc) return;
    const lctx = lc.getContext("2d");
    if (tool === "fill") {
      onHistoryPush();
      floodFill(lctx, artworkSize.w, artworkSize.h, Math.floor(a.x), Math.floor(a.y), color, 0.12);
      composite(); onChange();
      return;
    }
    if (SHAPES.has(tool)) {
      onHistoryPush();
      shapeStart.current = a; drawing.current = true;
      try { c.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    const def = tool === "eraser" ? ERASER_DEF : BRUSH_BY_ID[brush];
    if (!def) return;
    onHistoryPush();
    drawing.current = true; lastPt.current = a;
    stampDab(lctx, a.x, a.y, def, color, size, opacity);
    composite();
    try { c.setPointerCapture(e.pointerId); } catch {}
  };

  const onPointerMove = (e) => {
    const p = getPos(e);
    pointers.current.set(e.pointerId, p);
    setCursor(p);
    if (pinching.current && pointers.current.size >= 2) {
      const pts = [...pointers.current.values()];
      const s = pinchStart.current; if (!s) return;
      const d = dist(pts[0], pts[1]);
      const nz = Math.max(0.05, Math.min(16, s.zoom * (d / s.dist)));
      const m = midPt(pts[0], pts[1]);
      setZoom(nz);
      setPan({ x: m.x - s.art0.x * nz, y: m.y - s.art0.y * nz });
      return;
    }
    if (panning.current && panStart.current) {
      const dx = p.x - panStart.current.p.x;
      const dy = p.y - panStart.current.p.y;
      setPan({ x: panStart.current.pan.x + dx, y: panStart.current.pan.y + dy });
      return;
    }
    if (!drawing.current) return;
    const a = toArt(p);
    if (SHAPES.has(tool) && shapeStart.current) {
      composite();
      const c = displayRef.current; const ctx = c.getContext("2d"); const dpr = dprRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save(); ctx.translate(pan.x, pan.y); ctx.scale(zoom, zoom);
      strokeShape(ctx, tool, shapeStart.current.x, shapeStart.current.y, a.x, a.y, color, size, opacity);
      ctx.restore();
      return;
    }
    const lc = canvasMapRef.current.get(activeId);
    if (!lc) return;
    const lctx = lc.getContext("2d");
    const def = tool === "eraser" ? ERASER_DEF : BRUSH_BY_ID[brush];
    if (!def) return;
    drawSegment(lctx, lastPt.current, a, def, color, size, opacity);
    lastPt.current = a;
    composite();
  };

  const endStroke = (e) => {
    pointers.current.delete(e.pointerId);
    if (pinching.current) {
      if (pointers.current.size < 2) { pinching.current = false; pinchStart.current = null; }
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      return;
    }
    if (panning.current) {
      panning.current = false; panStart.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      return;
    }
    if (drawing.current) {
      if (SHAPES.has(tool) && shapeStart.current) {
        const p = getPos(e); const a = toArt(p);
        const lc = canvasMapRef.current.get(activeId);
        if (lc) strokeShape(lc.getContext("2d"), tool, shapeStart.current.x, shapeStart.current.y, a.x, a.y, color, size, opacity);
        shapeStart.current = null;
      }
      drawing.current = false; lastPt.current = null;
      onChange();
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  const commitText = () => {
    if (!textEditingRef.current) return;
    textEditingRef.current = false;
    setTextEditing(false);
    const v = textValue;
    setTextValue("");
    if (!v.trim()) return;
    const lc = canvasMapRef.current.get(activeId);
    if (!lc) return;
    const lctx = lc.getContext("2d");
    onHistoryPush();
    lctx.save();
    lctx.globalAlpha = opacity;
    lctx.fillStyle = color;
    lctx.font = `${Math.max(10, size * 2)}px ui-sans-serif, system-ui, sans-serif`;
    lctx.textBaseline = "top";
    lctx.fillText(v, textArt.x, textArt.y);
    lctx.restore();
    composite(); onChange();
  };

  const showCursor = (tool === "brush" || tool === "eraser") && cursor && !spacePan && !pinching.current;
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

      {tool === "text" && textEditing && (
        <input
          autoFocus
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); commitText(); }
            else if (e.key === "Escape") { textEditingRef.current = false; setTextEditing(false); setTextValue(""); }
          }}
          onBlur={commitText}
          placeholder="Type…"
          className="absolute z-10 min-w-[80px] rounded border border-primary bg-background px-1.5 py-0.5 text-sm text-foreground shadow-lg focus:outline-none"
          style={{ left: textPos.x, top: textPos.y }}
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