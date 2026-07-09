import React from "react";
import { Plus } from "lucide-react";
import { applicableParts } from "@/components/workshop/parts-catalog";
import { drawGlyph, COLORS } from "@/components/workshop/part-visuals";

function Delta({ value, unit }) {
  if (!value) return null;
  const sign = value > 0 ? "+" : "";
  const tone = value > 0 ? "text-emerald-500" : "text-amber-500";
  return (
    <span className={`font-mono text-[10px] ${tone}`}>
      {sign}
      {value}
      {unit}
    </span>
  );
}

export default function PartsCatalog({ vehicleType, onAdd }) {
  const parts = applicableParts(vehicleType);
  return (
    <div>
      <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Parts Catalog</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {parts.map((p) => {
          return (
            <button
              key={p.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData("text/part", p.id); e.dataTransfer.effectAllowed = "copy"; }}
              onClick={() => onAdd(p.id)}
              className="group flex items-center gap-3 rounded-xl border border-border/50 p-2.5 text-left transition-colors hover:border-primary"
              aria-label={`Add ${p.label}`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <svg width={48} height={48} viewBox="0 0 48 48">
                  {drawGlyph(p.id, COLORS)}
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground">{p.label}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {p.category} · {p.note}
                </p>
                <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
                  <Delta value={p.mass} unit="t" />
                  <Delta value={p.thrust} unit="kN" />
                  <Delta value={p.lift} />
                  <Delta value={p.drag} />
                  <Delta value={p.fuel} unit="s" />
                </div>
              </div>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}