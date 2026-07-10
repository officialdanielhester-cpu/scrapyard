import React, { useState, useRef, useEffect, useCallback } from "react";
import { SlidersHorizontal, Layers as LayersIcon } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DrawCanvas from "@/components/grid/DrawCanvas";
import ToolSidebar from "@/components/grid/ToolSidebar";
import LayersPanel from "@/components/grid/LayersPanel";

const PRESETS = [
  { label: "Landscape", w: 1280, h: 720 },
  { label: "Square", w: 1000, h: 1000 },
  { label: "Portrait", w: 720, h: 1280 },
  { label: "Wide", w: 1600, h: 900 },
];

const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : "L" + Date.now() + Math.random().toString(36).slice(2);

export default function PaintStudio() {
  const [artworkSize, setArtworkSize] = useState(PRESETS[0]);
  const canvasMapRef = useRef(new Map());
  const [layers, setLayers] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [version, setVersion] = useState(0);
  const [tool, setTool] = useState("brush");
  const [brush, setBrush] = useState("pen");
  const [color, setColor] = useState("#1e3a8a");
  const [size, setSize] = useState(10);
  const [opacity, setOpacity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [recent, setRecent] = useState([
    "#000000", "#ffffff", "#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7", "#ec4899",
  ]);
  const [spacePan, setSpacePan] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const undoRef = useRef([]);
  const redoRef = useRef([]);
  const inited = useRef(false);

  const bump = useCallback(() => setVersion((v) => v + 1), []);

  const makeLayer = (sz, name) => {
    const id = newId();
    const c = document.createElement("canvas");
    c.width = sz.w;
    c.height = sz.h;
    canvasMapRef.current.set(id, c);
    return { id, name, visible: true, opacity: 1 };
  };

  const newCanvas = useCallback((sz) => {
    canvasMapRef.current.clear();
    const l = makeLayer(sz, "Layer 1");
    setLayers([l]);
    setActiveId(l.id);
    undoRef.current = [];
    redoRef.current = [];
    setUndoCount(0);
    setRedoCount(0);
    setArtworkSize(sz);
    bump();
  }, [bump]);

  useEffect(() => {
    if (inited.current) return;
    inited.current = true;
    newCanvas(PRESETS[0]);
  }, [newCanvas]);

  const snapshot = useCallback(() => {
    const c = canvasMapRef.current.get(activeId);
    if (!c) return null;
    return { layerId: activeId, data: c.getContext("2d").getImageData(0, 0, c.width, c.height) };
  }, [activeId]);

  const pushHistory = useCallback(() => {
    const s = snapshot();
    if (!s) return;
    undoRef.current.push(s);
    if (undoRef.current.length > 40) undoRef.current.shift();
    redoRef.current = [];
    setUndoCount(undoRef.current.length);
    setRedoCount(0);
  }, [snapshot]);

  const undo = useCallback(() => {
    if (!undoRef.current.length) return;
    const cur = snapshot();
    if (cur) redoRef.current.push(cur);
    const s = undoRef.current.pop();
    const c = canvasMapRef.current.get(s.layerId);
    if (c) c.getContext("2d").putImageData(s.data, 0, 0);
    setUndoCount(undoRef.current.length);
    setRedoCount(redoRef.current.length);
    bump();
  }, [snapshot, bump]);

  const redo = useCallback(() => {
    if (!redoRef.current.length) return;
    const cur = snapshot();
    if (cur) undoRef.current.push(cur);
    const s = redoRef.current.pop();
    const c = canvasMapRef.current.get(s.layerId);
    if (c) c.getContext("2d").putImageData(s.data, 0, 0);
    setUndoCount(undoRef.current.length);
    setRedoCount(redoRef.current.length);
    bump();
  }, [snapshot, bump]);

  const addLayer = () => {
    const id = newId();
    const c = document.createElement("canvas");
    c.width = artworkSize.w;
    c.height = artworkSize.h;
    canvasMapRef.current.set(id, c);
    const idx = layers.findIndex((l) => l.id === activeId);
    const name = `Layer ${layers.length + 1}`;
    const next = [...layers];
    next.splice(idx + 1, 0, { id, name, visible: true, opacity: 1 });
    setLayers(next);
    setActiveId(id);
    bump();
  };

  const deleteLayer = (id) => {
    if (layers.length <= 1) return;
    const idx = layers.findIndex((l) => l.id === id);
    const next = layers.filter((l) => l.id !== id);
    canvasMapRef.current.delete(id);
    const newActive = next[Math.max(0, idx - 1)]?.id || next[0].id;
    setLayers(next);
    setActiveId(newActive);
    bump();
  };

  const duplicateLayer = (id) => {
    const src = canvasMapRef.current.get(id);
    const nid = newId();
    const c = document.createElement("canvas");
    c.width = artworkSize.w;
    c.height = artworkSize.h;
    if (src) c.getContext("2d").drawImage(src, 0, 0);
    canvasMapRef.current.set(nid, c);
    const idx = layers.findIndex((l) => l.id === id);
    const src2 = layers[idx];
    const next = [...layers];
    next.splice(idx + 1, 0, { id: nid, name: src2.name + " copy", visible: true, opacity: src2.opacity });
    setLayers(next);
    setActiveId(nid);
    bump();
  };

  const mergeDown = (id) => {
    const idx = layers.findIndex((l) => l.id === id);
    if (idx <= 0) return;
    const below = layers[idx - 1];
    const src = canvasMapRef.current.get(id);
    const dst = canvasMapRef.current.get(below.id);
    if (src && dst) {
      const ctx = dst.getContext("2d");
      ctx.globalAlpha = layers[idx].opacity;
      ctx.drawImage(src, 0, 0);
      ctx.globalAlpha = 1;
    }
    canvasMapRef.current.delete(id);
    const next = layers.filter((l) => l.id !== id);
    setLayers(next);
    setActiveId(below.id);
    bump();
  };

  const moveLayer = (id, dir) => {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    bump();
  };

  const setLayerOpacity = (id, val) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, opacity: val } : l)));
  };
  const toggleVisible = (id) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l)));
  };

  const clearLayer = () => {
    const c = canvasMapRef.current.get(activeId);
    if (!c) return;
    pushHistory();
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    bump();
  };

  const pushRecent = (hex) => {
    setRecent((r) => [hex.toLowerCase(), ...r.filter((c) => c.toLowerCase() !== hex.toLowerCase())].slice(0, 12));
  };
  const onColorPick = (hex) => {
    setColor(hex);
    pushRecent(hex);
  };

  const exportPNG = () => {
    const tmp = document.createElement("canvas");
    tmp.width = artworkSize.w;
    tmp.height = artworkSize.h;
    const ctx = tmp.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tmp.width, tmp.height);
    for (const l of layers) {
      if (!l.visible) continue;
      const lc = canvasMapRef.current.get(l.id);
      if (!lc) continue;
      ctx.globalAlpha = l.opacity;
      ctx.drawImage(lc, 0, 0);
    }
    ctx.globalAlpha = 1;
    const a = document.createElement("a");
    a.href = tmp.toDataURL("image/png");
    a.download = `the-grid-${Date.now()}.png`;
    a.click();
  };

  const onPreset = (p) => {
    if (p.label === artworkSize.label) return;
    if (window.confirm(`Start a new ${p.label} canvas? Current work will be cleared.`)) newCanvas(p);
  };

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") { setSpacePan(true); e.preventDefault(); return; }
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.ctrlKey || e.metaKey) && k === "y") { e.preventDefault(); redo(); return; }
      if (e.ctrlKey || e.metaKey) return;
      if (k === "b") setTool("brush");
      else if (k === "e") setTool("eraser");
      else if (k === "g") setTool("fill");
      else if (k === "i") setTool("eyedropper");
      else if (k === "h") setTool("move");
      else if (e.key === "[") setSize((s) => Math.max(1, s - 2));
      else if (e.key === "]") setSize((s) => Math.min(120, s + 2));
    };
    const onUp = (e) => { if (e.code === "Space") setSpacePan(false); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onUp);
    };
  }, [undo, redo]);

  return (
    <div className="flex h-full">
      {/* Desktop tool sidebar */}
      <ToolSidebar
        className="hidden md:flex w-60 shrink-0 overflow-y-auto border-r border-border/40 bg-background/60"
        tool={tool} setTool={setTool} brush={brush} setBrush={setBrush}
        size={size} setSize={setSize} opacity={opacity} setOpacity={setOpacity}
        color={color} setColor={setColor} recent={recent} pushRecent={pushRecent}
        onUndo={undo} onRedo={redo} undoCount={undoCount} redoCount={redoCount}
        onClear={clearLayer} onExport={exportPNG}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(16, z * 1.2))}
        onZoomOut={() => setZoom((z) => Math.max(0.05, z / 1.2))}
        presets={PRESETS} onPreset={onPreset} activePreset={artworkSize}
      />

      <div className="relative min-w-0 flex-1">
        <DrawCanvas
          artworkSize={artworkSize} layers={layers} activeId={activeId} canvasMapRef={canvasMapRef}
          tool={tool} brush={brush} color={color} size={size} opacity={opacity}
          zoom={zoom} pan={pan} setZoom={setZoom} setPan={setPan}
          onHistoryPush={pushHistory} onColorPick={onColorPick} onChange={bump}
          version={version} spacePan={spacePan}
        />

        {/* Mobile floating buttons for tool & layer sheets */}
        <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur transition-colors hover:border-primary hover:text-primary">
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto p-0">
              <SheetHeader className="px-4 pt-4">
                <SheetTitle className="font-mono text-xs uppercase tracking-wider">Tools</SheetTitle>
              </SheetHeader>
              <ToolSidebar
                className="border-0 bg-transparent"
                tool={tool} setTool={setTool} brush={brush} setBrush={setBrush}
                size={size} setSize={setSize} opacity={opacity} setOpacity={setOpacity}
                color={color} setColor={setColor} recent={recent} pushRecent={pushRecent}
                onUndo={undo} onRedo={redo} undoCount={undoCount} redoCount={redoCount}
                onClear={clearLayer} onExport={exportPNG}
                zoom={zoom}
                onZoomIn={() => setZoom((z) => Math.min(16, z * 1.2))}
                onZoomOut={() => setZoom((z) => Math.max(0.05, z / 1.2))}
                presets={PRESETS} onPreset={onPreset} activePreset={artworkSize}
              />
            </SheetContent>
          </Sheet>
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/90 shadow-md backdrop-blur transition-colors hover:border-primary hover:text-primary">
                <LayersIcon className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto p-0">
              <SheetHeader className="px-4 pt-4">
                <SheetTitle className="font-mono text-xs uppercase tracking-wider">Layers</SheetTitle>
              </SheetHeader>
              <LayersPanel
                className="border-0 bg-transparent"
                layers={layers} activeId={activeId} canvasMapRef={canvasMapRef} version={version}
                onSelect={setActiveId} onAdd={addLayer} onDelete={deleteLayer}
                onToggleVisible={toggleVisible} onOpacity={setLayerOpacity}
                onMoveUp={(id) => moveLayer(id, 1)} onMoveDown={(id) => moveLayer(id, -1)}
                onDuplicate={duplicateLayer} onMergeDown={mergeDown}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop layers panel */}
      <LayersPanel
        className="hidden w-60 shrink-0 border-l border-border/40 bg-background/60 lg:flex"
        layers={layers} activeId={activeId} canvasMapRef={canvasMapRef} version={version}
        onSelect={setActiveId} onAdd={addLayer} onDelete={deleteLayer}
        onToggleVisible={toggleVisible} onOpacity={setLayerOpacity}
        onMoveUp={(id) => moveLayer(id, 1)} onMoveDown={(id) => moveLayer(id, -1)}
        onDuplicate={duplicateLayer} onMergeDown={mergeDown}
      />
    </div>
  );
}