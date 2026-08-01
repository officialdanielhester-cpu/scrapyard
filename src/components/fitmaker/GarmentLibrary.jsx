import React, { useMemo, useState } from "react";
import { Shirt, Search } from "lucide-react";
import { TEMPLATES, CATEGORIES } from "@/components/fitmaker/garment-templates";

export default function GarmentLibrary({ onPick }) {
  const [cat, setCat] = useState("Tops");
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    let l = TEMPLATES.filter((t) => t.category === cat);
    if (q.trim()) { const s = q.toLowerCase(); l = TEMPLATES.filter((t) => t.name.toLowerCase().includes(s) || t.category.toLowerCase().includes(s)); }
    return l;
  }, [cat, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shirt className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h3 className="font-heading text-sm font-bold">Garment Library</h3>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search garments…" className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/50" />
      </div>

      {!q && (
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full px-2.5 py-1 text-[11px] ${cat === c ? "bg-primary text-white" : "border border-white/10 text-muted-foreground hover:text-foreground"}`}>{c}</button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {list.map((t) => (
          <button key={t.id} onClick={() => onPick(t.id)} className="group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:border-primary hover:bg-primary/10">
            <div className="flex h-24 w-full items-center justify-center">
              <svg viewBox={t.viewBox} className="h-20 w-20">
                {t.groups.map((g) => (
                  <path key={g.id} d={g.d} fill={g.role === "detail" ? "none" : t.defaultColor} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
                ))}
              </svg>
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}