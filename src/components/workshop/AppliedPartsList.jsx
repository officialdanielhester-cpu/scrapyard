import React from "react";
import { Plus, Minus, X, Package } from "lucide-react";
import { PARTS_BY_ID } from "@/components/workshop/parts-catalog";

export default function AppliedPartsList({ applied, onInc, onDec, onRemove }) {
  if (!applied || applied.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-8 text-center">
        <Package className="h-6 w-6 text-muted-foreground/50" strokeWidth={1} />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">No parts applied</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Add parts from the catalog</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {applied.map((ap) => {
        const p = PARTS_BY_ID[ap.type];
        if (!p) return null;
        const Icon = p.icon;
        return (
          <div key={ap.type} className="flex items-center gap-2 rounded-xl border border-border/50 p-2.5">
            <Icon className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
            <span className="flex-1 truncate text-xs font-medium text-foreground">{p.label}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDec(ap.type)}
                className="rounded-full border border-border/60 p-1 transition-colors hover:border-primary hover:text-primary"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" strokeWidth={2} />
              </button>
              <span className="w-5 text-center font-mono text-xs text-foreground">{ap.qty}</span>
              <button
                onClick={() => onInc(ap.type)}
                className="rounded-full border border-border/60 p-1 transition-colors hover:border-primary hover:text-primary"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" strokeWidth={2} />
              </button>
            </div>
            <button
              onClick={() => onRemove(ap.type)}
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label="Remove part"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        );
      })}
    </div>
  );
}