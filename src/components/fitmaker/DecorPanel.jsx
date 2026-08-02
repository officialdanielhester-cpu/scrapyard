import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { DECORATIONS, DECOR_BY_ID } from "@/components/fitmaker/decorations";

const uid = () => Math.random().toString(36).slice(2, 9);

// Decorate tool: add frills, jewels, buttons, pearls, sequins, bows, lace,
// zippers, patches, stars, chains — then drag them on the garment (in the
// canvas) and fine-tune position, size and color here.
export default function DecorPanel({ decorations = [], onChange }) {
  const [selId, setSelId] = useState(null);

  const add = (dec) => {
    const d = { id: uid(), type: dec.id, x: 150, y: 180, scale: 1, color: dec.defaultColor };
    onChange([...decorations, d]);
    setSelId(d.id);
  };
  const remove = (id) => { onChange(decorations.filter((d) => d.id !== id)); if (selId === id) setSelId(null); };
  const update = (id, patch) => onChange(decorations.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const sel = decorations.find((d) => d.id === selId);

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Add Embellishment</p>
        <div className="grid grid-cols-3 gap-1.5">
          {DECORATIONS.map((dec) => (
            <button key={dec.id} onClick={() => add(dec)} title={`Add ${dec.name}`} className="flex items-center gap-1 rounded-lg border border-border/60 px-1 py-2 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary">
              <svg viewBox="-16 -16 32 32" className="h-5 w-5 shrink-0"><g>{dec.render(dec.defaultColor)}</g></svg>
              <span className="truncate">{dec.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">On Garment ({decorations.length})</p>
        {decorations.length === 0 ? (
          <p className="text-[11px] leading-relaxed text-muted-foreground">Tap an embellishment above to drop it on the garment, then drag it where you like.</p>
        ) : (
          <div className="space-y-1.5">
            {decorations.map((d) => {
              const dec = DECOR_BY_ID[d.type];
              return (
                <div key={d.id} onClick={() => setSelId(d.id)} className={`rounded-lg border p-1.5 ${selId === d.id ? "border-primary bg-primary/5" : "border-border/60"}`}>
                  <div className="flex items-center gap-2">
                    <svg viewBox="-16 -16 32 32" className="h-5 w-5 shrink-0"><g>{dec?.render(d.color)}</g></svg>
                    <span className="flex-1 truncate text-[11px]">{dec?.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); remove(d.id); }} className="text-muted-foreground transition-colors hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                  {selId === d.id && (
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      <label className="block"><span className="mb-0.5 block font-mono text-[9px] uppercase text-muted-foreground">X {Math.round(d.x)}</span><input type="range" min="10" max="290" step="1" value={d.x} onChange={(e) => update(d.id, { x: Number(e.target.value) })} className="w-full accent-primary" /></label>
                      <label className="block"><span className="mb-0.5 block font-mono text-[9px] uppercase text-muted-foreground">Y {Math.round(d.y)}</span><input type="range" min="10" max="350" step="1" value={d.y} onChange={(e) => update(d.id, { y: Number(e.target.value) })} className="w-full accent-primary" /></label>
                      <label className="block"><span className="mb-0.5 block font-mono text-[9px] uppercase text-muted-foreground">Size {d.scale.toFixed(1)}×</span><input type="range" min="0.4" max="3" step="0.1" value={d.scale} onChange={(e) => update(d.id, { scale: Number(e.target.value) })} className="w-full accent-primary" /></label>
                      <label className="block"><span className="mb-0.5 block font-mono text-[9px] uppercase text-muted-foreground">Color</span><input type="color" value={d.color} onChange={(e) => update(d.id, { color: e.target.value })} className="h-6 w-full cursor-pointer rounded border border-border/60 bg-transparent" /></label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}