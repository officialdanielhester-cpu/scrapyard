import React, { useState } from "react";
import { Box, MousePointer, Hand, Brush, Pen, Waves, Expand, Layers, GitMerge, FlipHorizontal, Trash2, Undo2, Redo2, Plus, Copy, Search, Eye, EyeOff, Sun, Moon, Download, Sparkles, Boxes, ChevronDown, LayoutGrid, Lock } from "lucide-react";
import { BRUSHES } from "@/components/studio/sculpt-brushes";

const MODES = [
  { id: "object", label: "Object", icon: Box },
  { id: "edit", label: "Edit", icon: MousePointer },
  { id: "sculpt", label: "Sculpt", icon: Hand },
  { id: "paint", label: "Paint", icon: Brush },
];

const MESH_TYPES = ["box", "sphere", "cylinder", "cone", "torus", "plane", "icosahedron"];

const PRIMITIVE_ICONS = { box: Box, sphere: Box, cylinder: Box, cone: Box, torus: Box, plane: Box, icosahedron: Box };

export default function StudioSidebar(props) {
  const { objects, selectedId, mode, brush, brushSize, brushStrength, paintColor, theme, snap, canUndo, canRedo } = props;
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const sel = objects.find((o) => o.id === selectedId);
  const isMesh = sel?.kind === "mesh";

  const btn = "flex items-center justify-center gap-1.5 rounded-lg border border-border/60 bg-background/50 px-3 py-2 text-xs font-medium transition-all hover:border-primary/60 hover:bg-primary/5 hover:text-primary disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:bg-transparent disabled:hover:text-foreground";
  const toolBtn = (active) => `flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-border/60 bg-background/50 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"}`;

  return (
    <div className="flex w-full flex-col gap-4 lg:w-72">
      {/* Mode tabs */}
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-border/50 bg-background/30 p-1.5">
        {MODES.map((m) => { const Icon = m.icon; const isActive = mode === m.id; return (
          <button key={m.id} onClick={() => props.onModeChange(m.id)} className={`flex flex-col items-center gap-1.5 rounded-lg py-2.5 transition-all ${isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}>
            <Icon className="h-4 w-4" strokeWidth={isActive ? 2 : 1.5} /><span className="font-mono text-[9px] uppercase tracking-wider">{m.label}</span>
          </button>); })}
      </div>

      {/* Undo / Redo */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={props.onUndo} disabled={!canUndo} className={btn}><Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Undo</button>
        <button onClick={props.onRedo} disabled={!canRedo} className={btn}><Redo2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Redo</button>
      </div>

      {/* Contextual tools */}
      {mode === "object" && (
        <div className="space-y-3 rounded-2xl border border-border/50 bg-background/30 p-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Add</h3>
          <div className="relative">
            <button onClick={() => setAddOpen(o => !o)} className={`flex w-full items-center gap-1.5 ${btn}`}><Plus className="h-3.5 w-3.5" /> Add Mesh <ChevronDown className={`ml-auto h-3 w-3 transition-transform ${addOpen ? "rotate-180" : ""}`} /></button>
            {addOpen && (
              <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg border border-border/60 bg-background p-1 shadow-md">
                {MESH_TYPES.map((t) => <button key={t} onClick={() => { props.onAddMesh(t); setAddOpen(false); }} className="rounded-md px-2 py-1.5 text-[11px] capitalize transition-colors hover:bg-primary/10 hover:text-primary">{t}</button>)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={props.onImport} className={btn} title="Import model"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={props.onGenerate} className={btn} title="Generate with AI"><Sparkles className="h-3.5 w-3.5" /></button>
            <button onClick={props.onPresets} className={btn} title="Model presets"><Boxes className="h-3.5 w-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={props.onDuplicate} disabled={!sel} className={btn}><Copy className="h-3.5 w-3.5" /> Duplicate</button>
            <button onClick={props.onDelete} disabled={!sel} className={`${btn} text-destructive hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive`}><Trash2 className="h-3.5 w-3.5" /> Delete</button>
          </div>
          <label className="flex items-center gap-2 pt-1 cursor-pointer"><input type="checkbox" checked={snap} onChange={(e) => props.onToggleSnap()} className="accent-primary" /><span className="text-xs text-muted-foreground">Snap to grid</span></label>
        </div>
      )}

      {mode === "edit" && (
        <div className="space-y-2.5 rounded-2xl border border-border/50 bg-background/30 p-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Edit Tools</h3>
          {!isMesh ? <p className="text-xs text-muted-foreground">Select a mesh object to edit</p> : (
            <>
              <button onClick={props.onExtrude} className={`${toolBtn(true)} w-full`}><Box className="h-3.5 w-3.5" /> Extrude Face</button>
              <button onClick={props.onSubdivide} className={`${toolBtn(false)} w-full`}><LayoutGrid className="h-3.5 w-3.5" /> Subdivide</button>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={props.onMerge} className={`${toolBtn(false)}`}><GitMerge className="h-3.5 w-3.5" /> Merge</button>
                <button onClick={props.onMirror} className={`${toolBtn(false)}`}><FlipHorizontal className="h-3.5 w-3.5" /> Mirror</button>
              </div>
              <button onClick={props.onDeleteFaces} className={`${toolBtn(false)} w-full text-destructive hover:border-destructive/60 hover:bg-destructive/5 hover:text-destructive`}><Trash2 className="h-3.5 w-3.5" /> Delete Faces</button>
            </>
          )}
        </div>
      )}

      {mode === "sculpt" && (
        <div className="space-y-3 rounded-2xl border border-border/50 bg-background/30 p-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Sculpt Brushes</h3>
          {!isMesh ? <p className="text-xs text-muted-foreground">Select a mesh object to sculpt</p> : (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {BRUSHES.map((b) => { const Icon = b.id === "draw" ? Pen : b.id === "grab" ? Hand : b.id === "smooth" ? Waves : b.id === "inflate" ? Expand : Layers; return (
                  <button key={b.id} onClick={() => props.onBrushChange(b.id)} className={toolBtn(brush === b.id)} title={b.desc}><Icon className="h-3.5 w-3.5" /> {b.name}</button>); })}
              </div>
              <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Brush Size {brushSize.toFixed(2)}</label><input type="range" min="0.1" max="3" step="0.05" value={brushSize} onChange={(e) => props.onBrushSize(Number(e.target.value))} className="w-full accent-primary" /></div>
              <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Strength {Math.round(brushStrength * 100)}%</label><input type="range" min="0.05" max="1" step="0.05" value={brushStrength} onChange={(e) => props.onBrushStrength(Number(e.target.value))} className="w-full accent-primary" /></div>
            </>
          )}
        </div>
      )}

      {mode === "paint" && (
        <div className="space-y-3 rounded-2xl border border-border/50 bg-background/30 p-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Vertex Paint</h3>
          {!isMesh ? <p className="text-xs text-muted-foreground">Select a mesh object to paint</p> : (
            <>
              <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Color</label><input type="color" value={paintColor} onChange={(e) => props.onPaintColor(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-border/60 bg-transparent" /></div>
              <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Brush Size {brushSize.toFixed(2)}</label><input type="range" min="0.1" max="3" step="0.05" value={brushSize} onChange={(e) => props.onBrushSize(Number(e.target.value))} className="w-full accent-primary" /></div>
              <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Strength {Math.round(brushStrength * 100)}%</label><input type="range" min="0.05" max="1" step="0.05" value={brushStrength} onChange={(e) => props.onBrushStrength(Number(e.target.value))} className="w-full accent-primary" /></div>
            </>
          )}
        </div>
      )}

      {/* Outliner */}
      <div className="rounded-2xl border border-border/50 bg-background/30 p-3">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Outliner</h3>
          <div className="ml-auto flex items-center gap-1 rounded-lg border border-border/40 bg-background/50 px-2 py-1"><Search className="h-3 w-3 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-20 bg-transparent text-xs focus:outline-none placeholder:text-muted-foreground/60" /></div>
        </div>
        {objects.length === 0 ? <p className="text-xs text-muted-foreground">Empty scene</p> : (
          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
            {objects.filter((o) => o.name.toLowerCase().includes(search.toLowerCase())).map((o) => (
              <li key={o.id}>
                <button onClick={() => props.onSelectObject(o.id)} className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${selectedId === o.id ? "bg-primary/15 text-primary" : "hover:bg-foreground/5"}`}>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: o.kind === "mesh" ? "#d4d4d8" : o.parts[0]?.color }} />
                  <span className="flex-1 truncate">{o.name}</span>
                  {o.kind === "mesh" && <span className="font-mono text-[9px] text-muted-foreground">mesh</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Properties */}
      {sel && (
        <div className="space-y-3 rounded-2xl border border-border/50 bg-background/30 p-3">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Properties</h3>
          <div className="grid grid-cols-3 gap-2">
            {["x","y","z"].map((ax, i) => (
              <label key={ax} className="block"><span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Pos {ax}</span><input type="number" step="0.1" value={sel.pos[i].toFixed(2)} onChange={(e) => { const np = [...sel.pos]; np[i] = Number(e.target.value) || 0; props.onUpdateObject(sel.id, { pos: np }); }} className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs" /></label>
            ))}
          </div>
          <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Scale {sel.scale.toFixed(2)}×</label><input type="range" min="0.2" max="4" step="0.1" value={sel.scale} onChange={(e) => props.onUpdateObject(sel.id, { scale: Number(e.target.value) })} className="w-full accent-primary" /></div>
          <div className="grid grid-cols-3 gap-2">
            {["x","y","z"].map((ax, i) => (
              <label key={ax} className="block"><span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Rot {ax}°</span><input type="number" step="5" value={Math.round((sel.rot[i] * 180) / Math.PI)} onChange={(e) => { const nr = [...sel.rot]; nr[i] = ((Number(e.target.value) || 0) * Math.PI) / 180; props.onUpdateObject(sel.id, { rot: nr }); }} className="w-full rounded-md border border-border/60 bg-background px-2 py-1 text-xs" /></label>
            ))}
          </div>
          <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Metalness {Math.round((sel.metal ?? 0.3) * 100)}%</label><input type="range" min="0" max="1" step="0.05" value={sel.metal ?? 0.3} onChange={(e) => props.onUpdateObject(sel.id, { metal: Number(e.target.value) })} className="w-full accent-primary" /></div>
          <div><label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Roughness {Math.round((sel.rough ?? 0.55) * 100)}%</label><input type="range" min="0" max="1" step="0.05" value={sel.rough ?? 0.55} onChange={(e) => props.onUpdateObject(sel.id, { rough: Number(e.target.value) })} className="w-full accent-primary" /></div>
        </div>
      )}

      {/* Theme + camera lock */}
      <div className="grid grid-cols-2 gap-2">
        <button onClick={props.onToggleTheme} className={btn}>{theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {theme === "dark" ? "Light" : "Dark"}</button>
        <button onClick={props.onToggleCameraLock} className={toolBtn(!!props.cameraLock)} title="Lock camera to prevent orbit while sculpting"><Lock className="h-3.5 w-3.5" /> Cam Lock</button>
      </div>
    </div>
  );
}