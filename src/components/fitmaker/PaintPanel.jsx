import React, { useState } from "react";
import { Eraser, Trash2 } from "lucide-react";
import { BRUSHES } from "@/components/grid/brushes";
import ColorPicker from "@/components/grid/ColorPicker";

// Paint tool for the Fit Maker 2D garment view. Reuses The Grid's brush engine
// definitions (pen / ink / pencil / brush / airbrush / marker / highlighter /
// calligraphy) plus an eraser, a full HSV color picker, and size + opacity.
export default function PaintPanel({ paint, setPaint, onClear }) {
  const set = (k, v) => setPaint((p) => ({ ...p, [k]: v }));
  const [recent, setRecent] = useState(["#3b82f6", "#ffffff", "#000000", "#ef4444", "#22c55e", "#f59e0b", "#a855f7", "#14b8a6"]);
  const pushRecent = (c) => setRecent((r) => [c, ...r.filter((x) => x !== c)].slice(0, 10));
  const isEraser = paint.brush === "eraser";

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Brush</p>
        <div className="grid grid-cols-3 gap-1.5">
          {BRUSHES.map((b) => (
            <button
              key={b.id}
              onClick={() => set("brush", b.id)}
              className={`rounded-lg border px-1 py-2 text-[10px] transition-colors ${paint.brush === b.id ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
            >
              {b.label}
            </button>
          ))}
          <button
            onClick={() => set("brush", "eraser")}
            className={`flex items-center justify-center gap-1 rounded-lg border px-1 py-2 text-[10px] transition-colors ${isEraser ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
          >
            <Eraser className="h-3.5 w-3.5" /> Erase
          </button>
        </div>
      </div>

      <div className={isEraser ? "pointer-events-none opacity-40" : ""}>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Color</p>
        <ColorPicker color={paint.color} onChange={(c) => set("color", c)} recent={recent} onPushRecent={pushRecent} />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Size {paint.size}</label>
        <input type="range" min="1" max="40" step="1" value={paint.size} onChange={(e) => set("size", Number(e.target.value))} className="w-full accent-primary" />
      </div>
      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Opacity {Math.round(paint.opacity * 100)}%</label>
        <input type="range" min="0.1" max="1" step="0.05" value={paint.opacity} onChange={(e) => set("opacity", Number(e.target.value))} className="w-full accent-primary" />
      </div>

      <button
        onClick={onClear}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border/60 py-2 text-xs text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" /> Clear Paint
      </button>
    </div>
  );
}