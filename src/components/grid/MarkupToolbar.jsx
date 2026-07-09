import React from "react";
import { PenLine, Brush, Highlighter, Eraser } from "lucide-react";
import { MARKUP_COLORS } from "@/components/grid/markup-helpers";

const TOOLS = [
  { id: "pen", label: "Pen", Icon: PenLine },
  { id: "marker", label: "Marker", Icon: Brush },
  { id: "highlighter", label: "Highlighter", Icon: Highlighter },
];

export default function MarkupToolbar({ tool, setTool, color, setColor, size, setSize, onClear }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Tool
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TOOLS.map((t) => {
            const Icon = t.Icon;
            const on = tool === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors ${
                  on
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.5} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Color
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {MARKUP_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 ${
                color === c ? "border-foreground" : "border-transparent"
              }`}
              style={{ background: c }}
              aria-label={c}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded-full border border-border/60 bg-transparent"
            aria-label="Custom color"
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm text-foreground/80">Brush size</span>
          <span className="font-mono text-[10px] text-muted-foreground">{size}px</span>
        </div>
        <input
          type="range"
          min={1}
          max={14}
          step={1}
          value={size}
          onChange={(e) => setSize(parseInt(e.target.value, 10))}
          className="w-full accent-primary"
        />
      </div>

      <button
        onClick={onClear}
        className="flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:bg-destructive/5"
      >
        <Eraser className="h-4 w-4" />
        Clear markup
      </button>
    </div>
  );
}