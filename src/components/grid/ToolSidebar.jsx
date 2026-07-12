import React from "react";
import {
  Pen, Pencil, Brush, SprayCan, Highlighter, Droplet, Feather,
  Eraser, PaintBucket, Pipette, Hand, Undo2, Redo2, Trash2, Download, ZoomIn, ZoomOut,
  Square, Circle, Slash, Type,
} from "lucide-react";
import { BRUSHES } from "@/components/grid/brushes";
import ColorPicker from "@/components/grid/ColorPicker";

const BRUSH_ICONS = {
  pen: Pen, ink: Droplet, pencil: Pencil, brush: Brush,
  airbrush: SprayCan, marker: Highlighter, highlighter: Highlighter, calligraphy: Feather,
};

const TOOLS = [
  { id: "brush", label: "Brush", Icon: Brush },
  { id: "eraser", label: "Eraser", Icon: Eraser },
  { id: "fill", label: "Fill", Icon: PaintBucket },
  { id: "eyedropper", label: "Pick", Icon: Pipette },
  { id: "move", label: "Move", Icon: Hand },
  { id: "line", label: "Line", Icon: Slash },
  { id: "rect", label: "Rect", Icon: Square },
  { id: "ellipse", label: "Oval", Icon: Circle },
  { id: "text", label: "Text", Icon: Type },
];

function Label({ children, right }) {
  return (
    <div className="mb-1.5 flex items-center justify-between">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{children}</p>
      {right}
    </div>
  );
}

export default function ToolSidebar({
  className, tool, setTool, brush, setBrush, size, setSize, opacity, setOpacity,
  color, setColor, recent, pushRecent, onUndo, onRedo, undoCount, redoCount,
  onClear, onExport, zoom, onZoomIn, onZoomOut, presets, onPreset, activePreset,
}) {
  return (
    <aside className={className}>
      <div className="flex h-full flex-col gap-5 overflow-y-auto p-4">
        <div>
          <Label>Tools</Label>
          <div className="grid grid-cols-5 gap-1.5">
            {TOOLS.map((t) => {
              const active = tool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  title={t.label}
                  className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[9px] transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                >
                  <t.Icon className="h-4 w-4" strokeWidth={1.5} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>Brushes</Label>
          <div className="grid grid-cols-4 gap-1.5">
            {BRUSHES.map((b) => {
              const Icon = BRUSH_ICONS[b.id];
              const active = brush === b.id && tool === "brush";
              return (
                <button
                  key={b.id}
                  onClick={() => { setBrush(b.id); setTool("brush"); }}
                  title={b.label}
                  className={`flex flex-col items-center gap-1 rounded-lg border py-2 text-[8px] transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                >
                  {Icon && <Icon className="h-4 w-4" strokeWidth={1.5} />}
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label right={<span className="font-mono text-[10px] text-foreground/70">{size}px</span>}>Size</Label>
          <input type="range" min={1} max={120} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-primary" />
        </div>

        <div>
          <Label right={<span className="font-mono text-[10px] text-foreground/70">{Math.round(opacity * 100)}%</span>}>Opacity</Label>
          <input type="range" min={1} max={100} value={Math.round(opacity * 100)} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full accent-primary" />
        </div>

        <div>
          <Label>Color</Label>
          <ColorPicker color={color} onChange={setColor} recent={recent} onPushRecent={pushRecent} />
        </div>

        <div>
          <Label>Actions</Label>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={onUndo} disabled={undoCount === 0} className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2 text-[10px] disabled:opacity-40 hover:border-primary hover:text-primary">
              <Undo2 className="h-3.5 w-3.5" /> Undo
            </button>
            <button onClick={onRedo} disabled={redoCount === 0} className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2 text-[10px] disabled:opacity-40 hover:border-primary hover:text-primary">
              <Redo2 className="h-3.5 w-3.5" /> Redo
            </button>
            <button onClick={onClear} className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2 text-[10px] hover:border-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
            <button onClick={onExport} className="flex items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2 text-[10px] hover:border-primary hover:text-primary">
              <Download className="h-3.5 w-3.5" /> Export
            </button>
          </div>
        </div>

        <div>
          <Label>Canvas</Label>
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => onPreset(p)}
                className={`rounded-lg border py-1.5 text-[10px] transition-colors ${activePreset.label === p.label ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>View</Label>
          <div className="flex items-center gap-1.5">
            <button onClick={onZoomOut} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:border-primary hover:text-primary">
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="flex-1 text-center font-mono text-[10px] text-foreground/70">{Math.round(zoom * 100)}%</span>
            <button onClick={onZoomIn} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 hover:border-primary hover:text-primary">
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="font-mono text-[9px] leading-relaxed text-muted-foreground/50">
          B brush · E eraser · G fill · I pick · H move · L line · R rect · O oval · T text · [ ] size · space pan · pinch to zoom · ⌘Z undo
        </p>
      </div>
    </aside>
  );
}