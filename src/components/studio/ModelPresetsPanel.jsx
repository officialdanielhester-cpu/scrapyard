import React, { useState } from "react";
import { X, Boxes, Sword, Car } from "lucide-react";
import { PRESETS } from "@/components/studio/model-presets";

const CATS = [
  { id: "Weapons", icon: Sword },
  { id: "Vehicles", icon: Car },
];

// Slide-over listing composite model presets; clicking one drops it into the workspace.
export default function ModelPresetsPanel({ open, onClose, onAdd }) {
  const [cat, setCat] = useState("Weapons");
  if (!open) return null;
  const list = PRESETS.filter((p) => p.category === cat);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-border/60 bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background px-5 py-4">
          <div className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-heading text-sm font-bold">Models</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-4 flex w-fit gap-1 rounded-full border border-border/50 p-1">
            {CATS.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
                    cat === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" strokeWidth={1.5} />
                  {c.id}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            {list.map((preset) => (
              <button
                key={preset.name}
                onClick={() => { onAdd(preset); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-foreground/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60" style={{ background: preset.parts[0]?.color || "#3b82f6" }}>
                  <Boxes className="h-3.5 w-3.5 text-background/80" strokeWidth={1.5} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{preset.name}</span>
                  <span className="block font-mono text-[10px] uppercase text-muted-foreground">{preset.parts.length} parts</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}