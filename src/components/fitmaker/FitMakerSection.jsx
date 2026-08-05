import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Save, Undo2, Redo2, Download, Sparkles, Palette, Layers,
  Ruler, Wand2, Images, FolderOpen, RotateCw, Maximize2, Minimize2, Eye,
  X, ChevronLeft, ChevronRight, Shirt, Camera, History, Box, LayoutTemplate, Brush, Gem,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { linkToCurrentProject } from "@/components/workspace/use-current-project";
import IconButton from "@/components/shared/IconButton";
import { TEMPLATE_MAP, TEMPLATES, defaultState } from "@/components/fitmaker/garment-templates";
import GarmentCanvas from "@/components/fitmaker/GarmentCanvas";
import GarmentLibrary from "@/components/fitmaker/GarmentLibrary";
import ColorStudio from "@/components/fitmaker/ColorStudio";
import MaterialsPanel from "@/components/fitmaker/MaterialsPanel";
import MeasurementsPanel from "@/components/fitmaker/MeasurementsPanel";
import FeaturesPanel from "@/components/fitmaker/FeaturesPanel";
import AIPanel from "@/components/fitmaker/AIPanel";
import FitGallery from "@/components/fitmaker/FitGallery";
import VersionHistory from "@/components/fitmaker/VersionHistory";
import Fit3DWorkspace from "@/components/fitmaker/Fit3DWorkspace";
import PaintPanel from "@/components/fitmaker/PaintPanel";
import DecorPanel from "@/components/fitmaker/DecorPanel";

const uid = () => Math.random().toString(36).slice(2, 10);
const TOOLS = [
  { id: "color", label: "Color", icon: Palette },
  { id: "paint", label: "Paint", icon: Brush },
  { id: "material", label: "Fabric", icon: Layers },
  { id: "measure", label: "Fit", icon: Ruler },
  { id: "features", label: "Details", icon: Wand2 },
  { id: "decorate", label: "Decor", icon: Gem },
  { id: "ai", label: "AI", icon: Sparkles },
];

export default function FitMakerSection() {
  const [tabs, setTabs] = useState([]);
  const [activeKey, setActiveKey] = useState(null);
  const [tool, setTool] = useState("color");
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallerySignal, setGallerySignal] = useState(0);
  const [rotate, setRotate] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [turntable, setTurntable] = useState(false);
  const [showGuides, setShowGuides] = useState(false);
  const [transparent, setTransparent] = useState(true);
  const [exportMenu, setExportMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [viewMode, setViewMode] = useState("pattern");
  const [garmentImage, setGarmentImage] = useState("");
  const [paint, setPaint] = useState({ brush: "pen", color: "#3b82f6", size: 8, opacity: 1 });
  const canvasRef = useRef(null);
  const saveTimer = useRef(null);

  // Boot with a fresh T-shirt project.
  useEffect(() => {
    newProject("tshirt");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = tabs.find((t) => t.key === activeKey) || null;
  const template = active ? TEMPLATE_MAP[active.templateId] : null;

  // Turntable animation.
  useEffect(() => {
    if (!turntable) return;
    const id = setInterval(() => setRotate((r) => (r + 2) % 360), 40);
    return () => clearInterval(id);
  }, [turntable]);

  // Keep the 3D workspace's garment render in sync while in 3D mode.
  useEffect(() => {
    if (viewMode !== "3d" || !active) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      const img = await makeThumbnail();
      if (!cancelled && img) setGarmentImage(img);
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, active?.state, active?.templateId]);

  // ---- Project / tab management ----
  const newProject = useCallback((templateId, opts = {}) => {
    const tpl = TEMPLATE_MAP[templateId] || TEMPLATES[0];
    const key = uid();
    const tab = { key, name: opts.name || `${tpl.name} design`, templateId, designId: opts.designId || null, state: opts.state || defaultState(tpl), past: [], future: [], dirty: false };
    setTabs((prev) => [...prev, tab]);
    setActiveKey(key);
    setRotate(0); setZoom(1); setTurntable(false);
    return tab;
  }, []);

  const closeTab = (key) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.key === key);
      const next = prev.filter((t) => t.key !== key);
      if (activeKey === key) setActiveKey(next[idx - 1]?.key || next[0]?.key || null);
      return next;
    });
  };

  // ---- History-backed state patching for the active tab ----
  const patch = useCallback((next) => {
    setTabs((prev) => prev.map((t) => {
      if (t.key !== activeKey) return t;
      const value = typeof next === "function" ? next(t.state) : { ...t.state, ...next };
      if (value === t.state) return t;
      return { ...t, state: value, past: [...t.past, t.state].slice(-200), future: [], dirty: true };
    }));
    scheduleAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const undo = useCallback(() => {
    setTabs((prev) => prev.map((t) => {
      if (t.key !== activeKey || !t.past.length) return t;
      const prev2 = t.past[t.past.length - 1];
      return { ...t, state: prev2, past: t.past.slice(0, -1), future: [t.state, ...t.future].slice(0, 200), dirty: true };
    }));
    scheduleAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const redo = useCallback(() => {
    setTabs((prev) => prev.map((t) => {
      if (t.key !== activeKey || !t.future.length) return t;
      const nxt = t.future[0];
      return { ...t, state: nxt, past: [...t.past, t.state].slice(-200), future: t.future.slice(1), dirty: true };
    }));
    scheduleAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  // ---- Persistence (autosave) ----
  const scheduleAutosave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(true), 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const makeThumbnail = async () => {
    const svg = canvasRef.current;
    if (!svg) return "";
    try {
      const data = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([data], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
      const c = document.createElement("canvas");
      c.width = 240; c.height = 240 * (svg.viewBox.baseVal.height / svg.viewBox.baseVal.width);
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      return c.toDataURL("image/png");
    } catch { return ""; }
  };

  const doSave = useCallback(async (auto = false) => {
    if (!active) return;
    setSaving(true);
    try {
      const thumb = await makeThumbnail();
      const payload = {
        name: active.name,
        template_id: active.templateId,
        category: template?.category || "Tops",
        state: active.state,
        thumbnail: thumb,
        version: (active.version || 1) + (auto && active.designId ? 0 : 1),
      };
      if (active.designId) {
        await base44.entities.GarmentDesign.update(active.designId, payload);
      } else {
        const created = await base44.entities.GarmentDesign.create({ ...payload, collection: "My Designs", tags: [], favorite: false });
        setTabs((prev) => prev.map((t) => t.key === active.key ? { ...t, designId: created.id, version: created.version || 1, dirty: false } : t));
        linkToCurrentProject("design", created.id, created.name, thumb);
      }
      setSavedAt(new Date());
      setTabs((prev) => prev.map((t) => t.key === active.key ? { ...t, dirty: false } : t));
      setGallerySignal((s) => s + 1);
    } catch { /* ignore */ } finally { setSaving(false); }
  }, [active, template]);

  // ---- Version snapshots ----
  const createSnapshot = useCallback(async () => {
    if (!active || !active.designId) return;
    try {
      const thumb = await makeThumbnail();
      await base44.entities.GarmentVersion.create({
        design_id: active.designId,
        name: active.name,
        version_number: (active.version || 1),
        snapshot: { state: active.state, template_id: active.templateId, design_name: active.name },
        thumbnail: thumb,
      });
      setGallerySignal((s) => s + 1);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, template]);

  const restoreSnapshot = useCallback(async (v) => {
    if (!v?.snapshot) return;
    const tpl = TEMPLATE_MAP[v.snapshot.template_id] || template;
    setTabs((prev) => prev.map((t) => t.key === active.key ? {
      ...t,
      state: { ...defaultState(tpl), ...(v.snapshot.state || {}) },
      templateId: v.snapshot.template_id || t.templateId,
      name: v.snapshot.design_name || t.name,
      past: [...t.past, t.state].slice(-200),
      future: [],
      dirty: true,
    } : t));
    scheduleAutosave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, template]);

  // ---- Gallery open ----
  const openDesign = useCallback((d) => {
    newProject(d.template_id, { name: d.name, designId: d.id, state: { ...defaultState(TEMPLATE_MAP[d.template_id]), ...(d.state || {}) } });
    setGalleryOpen(false);
  }, [newProject]);

  // ---- Export ----
  const exportArt = useCallback(async (format) => {
    const svg = canvasRef.current;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    if (format === "svg") {
      download(new Blob([data], { type: "image/svg+xml" }), `${active?.name || "design"}.svg`);
      return;
    }
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const vb = svg.viewBox.baseVal;
    const scale = 3;
    const c = document.createElement("canvas");
    c.width = vb.width * scale; c.height = vb.height * scale;
    const ctx = c.getContext("2d");
    if (format === "jpg" || (format === "png" && !transparent)) { ctx.fillStyle = "#1a1033"; ctx.fillRect(0, 0, c.width, c.height); }
    ctx.drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    c.toBlob((b) => b && download(b, `${active?.name || "design"}.${format}`), format === "jpg" ? "image/jpeg" : "image/png", 0.95);
    setExportMenu(false);
  }, [active, transparent]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const onKey = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); doSave(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, doSave]);

  const canUndo = active?.past?.length > 0;
  const canRedo = active?.future?.length > 0;

  return (
    <div className="fit-maker flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="app-glass z-30 flex items-center gap-2 border-b px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <Shirt className="h-4 w-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="font-heading text-base font-extrabold tracking-tight">Fit Maker</span>
        </div>

        {/* Tabs */}
        <div className="ml-2 flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <div key={t.key} onClick={() => setActiveKey(t.key)} className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-xs ${activeKey === t.key ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <span className="max-w-[120px] truncate">{t.name}{t.dirty ? " ·" : ""}</span>
              <button onClick={(e) => { e.stopPropagation(); closeTab(t.key); }} className="opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <IconButton onClick={undo} disabled={!canUndo} title="Undo (⌘Z)"><Undo2 className="h-4 w-4" /></IconButton>
          <IconButton onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)"><Redo2 className="h-4 w-4" /></IconButton>
          <div className="mx-1 h-5 w-px bg-white/10" />
          <IconButton onClick={() => newProject("tshirt")} title="New design"><Plus className="h-4 w-4" /></IconButton>
          <IconButton onClick={() => setGalleryOpen(true)} title="Gallery"><Images className="h-4 w-4" /></IconButton>
          <button onClick={() => setViewMode((v) => (v === "pattern" ? "3d" : "pattern"))} title={viewMode === "pattern" ? "3D Studio view" : "2D Pattern view"} className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs ${viewMode === "3d" ? "border-primary bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}>
            {viewMode === "pattern" ? <Box className="h-3.5 w-3.5" /> : <LayoutTemplate className="h-3.5 w-3.5" />} {viewMode === "pattern" ? "3D" : "2D"}
          </button>
          <IconButton onClick={() => setHistoryOpen(true)} disabled={!active?.designId} title="Version history"><History className="h-4 w-4" /></IconButton>
          <button onClick={() => doSave()} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </button>
          <div className="relative">
            <IconButton onClick={() => setExportMenu((v) => !v)} title="Export"><Download className="h-4 w-4" /></IconButton>
            <AnimatePresence>
              {exportMenu && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-10 z-40 w-44 rounded-xl border border-white/10 bg-card p-1.5 shadow-2xl">
                  {["png", "svg", "jpg"].map((f) => (
                    <button key={f} onClick={() => exportArt(f)} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary">
                      <Download className="h-3.5 w-3.5" /> Export .{f.toUpperCase()}
                    </button>
                  ))}
                  <label className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary">
                    <Camera className="h-3.5 w-3.5" /> Export PNG (transparent)
                    <input type="checkbox" checked={transparent} onChange={(e) => setTransparent(e.target.checked)} className="ml-auto accent-primary" />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Left: garment library */}
        <aside className="app-glass hidden w-60 shrink-0 flex-col border-r p-3 md:flex">
          <div className="app-scroll flex-1 overflow-y-auto pr-1">
            <GarmentLibrary onPick={(id) => newProject(id)} />
          </div>
        </aside>

        {viewMode === "3d" && (
          <div className="flex min-w-0 flex-1 flex-col p-3">
            <Fit3DWorkspace garmentImage={garmentImage} garmentName={active?.name} />
          </div>
        )}
        <div className={viewMode === "3d" ? "hidden" : "contents"}>
        {/* Center: canvas */}
        <main className="relative flex min-w-0 flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,hsl(217_60%_20%/0.45),transparent_70%)] p-4">
          {active && template && (
            <motion.div key={active.key} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="app-glass relative rounded-3xl p-4 shadow-2xl">
              <GarmentCanvas ref={canvasRef} template={template} state={active.state} rotate={rotate} zoom={zoom} showGuides={showGuides} className="h-[min(56vh,420px)] w-auto"
                paint={tool === "paint"} paintBrush={paint.brush} paintColor={paint.color} paintSize={paint.size} paintOpacity={paint.opacity}
                onPaintStroke={(s) => patch({ strokes: [...(active.state.strokes || []), s] })}
                decorate={tool === "decorate"} onMoveDecoration={(id, x, y) => patch({ decorations: (active.state.decorations || []).map((d) => (d.id === id ? { ...d, x, y } : d)) })} />
            </motion.div>
          )}

          {/* Floating viewport controls */}
          <div className="app-glass absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5 md:bottom-4">
            <IconButton onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} title="Zoom out"><Minimize2 className="h-4 w-4" /></IconButton>
            <span className="w-10 text-center font-mono text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <IconButton onClick={() => setZoom((z) => Math.min(2, z + 0.1))} title="Zoom in"><Maximize2 className="h-4 w-4" /></IconButton>
            <div className="mx-1 h-5 w-px bg-white/10" />
            <IconButton onClick={() => setRotate((r) => r - 15)} title="Rotate left"><ChevronLeft className="h-4 w-4" /></IconButton>
            <button onClick={() => setTurntable((v) => !v)} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${turntable ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"}`}><RotateCw className="h-3.5 w-3.5" /> Turntable</button>
            <IconButton onClick={() => setRotate((r) => r + 15)} title="Rotate right"><ChevronRight className="h-4 w-4" /></IconButton>
            <div className="mx-1 h-5 w-px bg-white/10" />
            <IconButton onClick={() => setShowGuides((v) => !v)} title="Measurement guides" active={showGuides}><Eye className="h-4 w-4" /></IconButton>
          </div>

          {/* mobile library access */}
          <button onClick={() => setGalleryOpen(true)} className="app-glass absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] text-muted-foreground md:hidden"><FolderOpen className="h-3.5 w-3.5" /> Library</button>

          {savedAt && <span className="absolute right-4 top-4 font-mono text-[9px] text-muted-foreground/60">Saved {savedAt.toLocaleTimeString()}</span>}
        </main>

        {/* Right: tool dock */}
        <aside className="app-glass flex w-[320px] shrink-0 flex-col border-l">
          <div className="flex items-center gap-1 border-b p-1.5">
            {TOOLS.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)} className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] ${tool === t.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="h-4 w-4" strokeWidth={1.5} />{t.label}
              </button>
            ))}
          </div>
          <div className="app-scroll flex-1 overflow-y-auto p-4">
            {active && template && tool === "color" && <ColorStudio state={active.state} onChange={patch} />}
            {active && template && tool === "paint" && <PaintPanel paint={paint} setPaint={setPaint} onClear={() => patch({ strokes: [] })} />}
            {active && template && tool === "decorate" && <DecorPanel decorations={active.state.decorations || []} onChange={(d) => patch({ decorations: d })} />}
            {active && template && tool === "material" && <MaterialsPanel state={active.state} onChange={patch} />}
            {active && template && tool === "measure" && <MeasurementsPanel template={template} state={active.state} onChange={patch} showGuides={showGuides} onToggleGuides={() => setShowGuides((v) => !v)} />}
            {active && template && tool === "features" && <FeaturesPanel template={template} state={active.state} onChange={patch} />}
            {active && template && tool === "ai" && <AIPanel template={template} state={active.state} onApply={patch} />}
          </div>
          {/* Project meta */}
          {active && (
            <div className="border-t p-3">
              <input value={active.name} onChange={(e) => setTabs((prev) => prev.map((t) => t.key === active.key ? { ...t, name: e.target.value, dirty: true } : t))} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs outline-none focus:border-primary" />
            </div>
          )}
        </aside>
        </div>
      </div>

      <FitGallery open={galleryOpen} onClose={() => setGalleryOpen(false)} onOpen={openDesign} refreshSignal={gallerySignal} />
      <VersionHistory
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        designId={active?.designId}
        activeVersion={active?.version || 0}
        onCreateSnapshot={createSnapshot}
        onRestore={restoreSnapshot}
      />
    </div>
  );
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// IconBtn is now shared via @/components/shared/IconButton