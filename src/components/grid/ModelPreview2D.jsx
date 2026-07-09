import React, { useEffect, useRef } from "react";
import { styleFor } from "@/components/grid/markup-helpers";

export default function ModelPreview2D({ model, paintingActive, tool, color, size, onMarkupChange }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const imgRectRef = useRef(null);
  const stateRef = useRef(null);
  const curStrokeRef = useRef(null);
  const lastPtRef = useRef(null);

  const paintingActiveRef = useRef(paintingActive);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);
  const onMarkupChangeRef = useRef(onMarkupChange);
  const markupRef = useRef(model.markup);
  paintingActiveRef.current = paintingActive;
  toolRef.current = tool;
  colorRef.current = color;
  sizeRef.current = size;
  onMarkupChangeRef.current = onMarkupChange;
  markupRef.current = model.markup;

  const computeImgRect = () => {
    const cont = containerRef.current;
    const img = imgRef.current;
    if (!cont || !img || !img.naturalWidth) return;
    const r = cont.getBoundingClientRect();
    const s = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    imgRectRef.current = { x: (r.width - w) / 2, y: (r.height - h) / 2, w, h };
  };

  const setupCanvas = () => {
    const cont = containerRef.current;
    const c = canvasRef.current;
    if (!cont || !c) return;
    const r = cont.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = r.width * dpr;
    c.height = r.height * dpr;
    c.style.width = r.width + "px";
    c.style.height = r.height + "px";
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stateRef.current = { ctx };
  };

  const drawStrokeMapped = (ctx, stroke) => {
    const ir = imgRectRef.current;
    if (!ir) return;
    const pts = stroke.points || [];
    if (!pts.length) return;
    styleFor(ctx, stroke.tool, stroke.color, stroke.width);
    ctx.beginPath();
    ctx.moveTo(ir.x + pts[0][0] * ir.w, ir.y + pts[0][1] * ir.h);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(ir.x + pts[i][0] * ir.w, ir.y + pts[i][1] * ir.h);
    }
    if (pts.length === 1) {
      ctx.lineTo(ir.x + pts[0][0] * ir.w + 0.01, ir.y + pts[0][1] * ir.h);
    }
    ctx.stroke();
  };

  const redraw = () => {
    const st = stateRef.current;
    const cont = containerRef.current;
    if (!st || !cont) return;
    const r = cont.getBoundingClientRect();
    st.ctx.clearRect(0, 0, r.width, r.height);
    (markupRef.current || []).forEach((s) => drawStrokeMapped(st.ctx, s));
  };

  useEffect(() => {
    setupCanvas();
    computeImgRect();
    redraw();
    const ro = new ResizeObserver(() => {
      setupCanvas();
      computeImgRect();
      redraw();
    });
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    redraw();
  }, [model.markup]);

  const onImgLoad = () => {
    computeImgRect();
    redraw();
  };

  const toNorm = (e) => {
    const cont = containerRef.current;
    const ir = imgRectRef.current;
    if (!cont || !ir) return null;
    const r = cont.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    if (px < ir.x || px > ir.x + ir.w || py < ir.y || py > ir.y + ir.h) return null;
    return [(px - ir.x) / ir.w, (py - ir.y) / ir.h];
  };

  const onDown = (e) => {
    if (!paintingActiveRef.current) return;
    const p = toNorm(e);
    if (!p) return;
    e.preventDefault();
    const st = stateRef.current;
    const ir = imgRectRef.current;
    const stroke = {
      tool: toolRef.current,
      color: colorRef.current,
      width: sizeRef.current,
      points: [p],
    };
    curStrokeRef.current = stroke;
    lastPtRef.current = p;
    styleFor(st.ctx, stroke.tool, stroke.color, stroke.width);
    st.ctx.beginPath();
    st.ctx.moveTo(ir.x + p[0] * ir.w, ir.y + p[1] * ir.h);
    st.ctx.lineTo(ir.x + p[0] * ir.w + 0.01, ir.y + p[1] * ir.h);
    st.ctx.stroke();
  };

  const onMove = (e) => {
    if (!paintingActiveRef.current || !curStrokeRef.current) return;
    const p = toNorm(e);
    if (!p) return;
    e.preventDefault();
    const st = stateRef.current;
    const ir = imgRectRef.current;
    const last = lastPtRef.current;
    styleFor(st.ctx, curStrokeRef.current.tool, curStrokeRef.current.color, curStrokeRef.current.width);
    st.ctx.beginPath();
    st.ctx.moveTo(ir.x + last[0] * ir.w, ir.y + last[1] * ir.h);
    st.ctx.lineTo(ir.x + p[0] * ir.w, ir.y + p[1] * ir.h);
    st.ctx.stroke();
    curStrokeRef.current.points.push(p);
    lastPtRef.current = p;
  };

  useEffect(() => {
    const onUp = () => {
      const s = curStrokeRef.current;
      if (!s) return;
      curStrokeRef.current = null;
      lastPtRef.current = null;
      onMarkupChangeRef.current && onMarkupChangeRef.current([...(markupRef.current || []), s]);
    };
    window.addEventListener("pointerup", onUp);
    return () => window.removeEventListener("pointerup", onUp);
  }, []);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-background">
      <img
        ref={imgRef}
        src={model.image_url}
        onLoad={onImgLoad}
        alt=""
        className="absolute inset-0 h-full w-full object-contain"
      />
      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        className="absolute inset-0 h-full w-full touch-none"
        style={{ cursor: paintingActive ? "crosshair" : "default" }}
      />
    </div>
  );
}