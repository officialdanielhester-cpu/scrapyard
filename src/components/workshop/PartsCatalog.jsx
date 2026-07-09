import React from "react";
import { Plus } from "lucide-react";
import { applicableParts } from "@/components/workshop/parts-catalog";

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
          const Icon = p.icon;
          return (
            <div key={p.id} className="flex items-start gap-2 rounded-xl border border-border/50 p-3">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
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
              <button
                onClick={() => onAdd(p.id)}
                className="shrink-0 rounded-full border border-border/60 p-1.5 transition-colors hover:border-primary hover:text-primary"
                aria-label={`Add ${p.label}`}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}