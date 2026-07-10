import React, { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Download, Loader2, Eye, Image as ImageIcon } from "lucide-react";
import PhotoAdjustments from "@/components/gallery/PhotoAdjustments";
import { DEFAULT_ADJ, processPixels, computeHistogram, rotatedSize, rotSteps, PRESETS } from "@/components/gallery/photo-adjust";

// Lightroom-style photo editor: develop pipeline (real pixel ops), histogram,
// presets, crop/rotate, before/after, and JPEG export at full resolution.
export default function PhotoEditor() {
  const [imgUrl, setImgUrl] = useState(null);
  const [imgEl, setImgEl] = useState(null);
  const [adj, setAdj] = useState({ ...DEFAULT_ADJ });
  const [showBefore, setShowBefore] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activePreset, setActivePreset] = useState("Original");
  const [histData, setHistData] = useState(null);

  const previewCanvasRef = useRef(null);
  const histCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!imgUrl) { setImgEl(null); return; }
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = imgUrl;
  }, [imgUrl]);

  const render = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const img = imgEl;
    if (!canvas || !img) return;
    const maxW = Math.min(1100, containerRef.current?.clientWidth || 900);
    const deg = (adj.straighten || 0) + 90 * rotSteps(adj.rot);
    const { w: rw, h: rh } = rotatedSize(img.naturalWidth, img.naturalHeight, deg);
    const scale = Math.min(1, maxW / Math.max(rw, rh));
    const cw = Math.max(1, Math.round(rw * scale));
    const ch = Math.max(1, Math.round(rh * scale));
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(cw / 2, ch / 2);
    ctx.rotate((deg * Math.PI) / 180);
    ctx.scale(adj.flipH ? -1 : 1, adj.flipV ? -1 : 1);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    const id = ctx.getImageData(0, 0, cw, ch);
    if (!showBefore) processPixels(id, adj);
    ctx.putImageData(id, 0, 0);
    setHistData(computeHistogram(id));
  }, [imgEl, adj, showBefore]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [render]);

  useEffect(() => {
    const c = histCanvasRef.current;
    if (!c || !histData) return;
    const ctx = c.getContext("2d");
    const W = c.width, H = c.height;
    ctx.clearRect(0, 0, W, H);
    const max = Math.max(1, ...histData.lum);
    const drawCh = (arr, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let i = 0; i < 256; i++) {
        ctx.lineTo((i / 255) * W, H - (arr[i] / max) * H);
      }
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    };
    ctx.globalCompositeOperation = "lighter";
    drawCh(histData.r, "rgba(255,40,40,0.5)");
    drawCh(histData.g, "rgba(40,255,40,0.5)");
    drawCh(histData.b, "rgba(40,80,255,0.5)");
    ctx.globalCompositeOperation = "source-over";
  }, [histData]);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgUrl(URL.createObjectURL(f));
    setAdj({ ...DEFAULT_ADJ });
    setActivePreset("Original");
    e.target.value = "";
  };

  const onChange = (patch) => { setAdj((a) => ({ ...a, ...patch })); setActivePreset("Custom"); };
  const onRotate = (dir) => setAdj((a) => ({ ...a, rot: rotSteps(a.rot + dir) }));
  const onFlip = (axis) => setAdj((a) => ({ ...a, [axis === "h" ? "flipH" : "flipV"]: !a[axis === "h" ? "flipH" : "flipV"] }));
  const onReset = () => { setAdj({ ...DEFAULT_ADJ }); setActivePreset("Original"); };

  const applyPreset = (p) => { setAdj({ ...DEFAULT_ADJ, ...p.adj }); setActivePreset(p.name); };

  const handleExport = async () => {
    if (!imgEl || exporting) return;
    setExporting(true);
    try {
      const deg = (adj.straighten || 0) + 90 * rotSteps(adj.rot);
      const { w: rw, h: rh } = rotatedSize(imgEl.naturalWidth, imgEl.naturalHeight, deg);
      const scale = Math.min(1, 4000 / Math.max(rw, rh));
      const cw = Math.max(1, Math.round(rw * scale)), ch = Math.max(1, Math.round(rh * scale));
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cw, ch);
      ctx.save();
      ctx.translate(cw / 2, ch / 2);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.scale(adj.flipH ? -1 : 1, adj.flipV ? -1 : 1);
      const dw = imgEl.naturalWidth * scale, dh = imgEl.naturalHeight * scale;
      ctx.drawImage(imgEl, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
      const id = ctx.getImageData(0, 0, cw, ch);
      processPixels(id, adj);
      ctx.putImageData(id, 0, 0);
      await new Promise((res) => canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "scrapyard-photo.jpg"; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        }
        res();
      }, "image/jpeg", 0.92));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen pb-10">
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Photo Editor</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Develop · Color · Export</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary">
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} /> Import
            <input type="file" accept="image/*" onChange={onFile} className="hidden" />
          </label>
          <button
            onClick={() => setShowBefore((s) => !s)}
            disabled={!imgEl}
            className={`flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${showBefore ? "border-primary text-primary" : "border-border/60 hover:border-primary hover:text-primary"}`}
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> {showBefore ? "Show After" : "Show Before"}
          </button>
          <button
            onClick={handleExport}
            disabled={!imgEl || exporting}
            className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={1.5} />}
            {exporting ? "Exporting…" : "Export"}
          </button>
        </div>
      </header>

      <div className="px-6 md:px-12">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div ref={containerRef} className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-black p-3">
              {imgEl ? (
                <canvas ref={previewCanvasRef} className="max-h-[62vh] max-w-full" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 opacity-40" strokeWidth={1} />
                  <p className="mt-2 text-sm">Import a photo to begin</p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/50 bg-card/40 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">Histogram</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/50">RGB · Luminance</span>
              </div>
              <canvas ref={histCanvasRef} width={300} height={64} className="h-16 w-full" />
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium transition-colors ${activePreset === p.name ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground hover:border-primary hover:text-primary"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <PhotoAdjustments adj={adj} onChange={onChange} onRotate={onRotate} onFlip={onFlip} onReset={onReset} />
        </div>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Sliders apply in real time · drag a preset for a one-click look · Export saves a full-resolution JPEG
        </p>
      </div>
    </div>
  );
}