import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Star, Trash2, FolderOpen } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { TEMPLATE_MAP } from "@/components/fitmaker/garment-templates";

export default function FitGallery({ open, onClose, onOpen, refreshSignal }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [favOnly, setFavOnly] = useState(false);
  const [collection, setCollection] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    try { const list = await base44.entities.GarmentDesign.list("-updated_date", 200); setDesigns(list || []); } catch { setDesigns([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { if (open) load(); }, [open, load, refreshSignal]);

  const collections = useMemo(() => ["All", ...Array.from(new Set(designs.map((d) => d.collection || "My Designs")))], [designs]);

  const filtered = useMemo(() => {
    let l = designs;
    if (collection !== "All") l = l.filter((d) => (d.collection || "My Designs") === collection);
    if (favOnly) l = l.filter((d) => d.favorite);
    if (q.trim()) { const s = q.toLowerCase(); l = l.filter((d) => (d.name || "").toLowerCase().includes(s) || (d.tags || []).some((t) => t.toLowerCase().includes(s))); }
    return l;
  }, [designs, collection, favOnly, q]);

  const toggleFav = async (d, e) => {
    e.stopPropagation();
    try { await base44.entities.GarmentDesign.update(d.id, { favorite: !d.favorite }); load(); } catch {}
  };
  const remove = async (d, e) => {
    e.stopPropagation();
    try { await base44.entities.GarmentDesign.delete(d.id); load(); } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle className="font-heading">Gallery</SheetTitle></SheetHeader>
        <div className="space-y-3 p-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search designs & tags…" className="w-full bg-transparent text-xs outline-none" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setFavOnly((v) => !v)} className={`rounded-full px-2.5 py-1 text-[11px] ${favOnly ? "bg-primary text-white" : "border border-white/10 text-muted-foreground"}`}>
              <Star className="mr-1 inline h-3 w-3" /> Favorites
            </button>
            {collections.map((c) => (
              <button key={c} onClick={() => setCollection(c)} className={`rounded-full px-2.5 py-1 text-[11px] ${collection === c ? "bg-primary/15 text-primary" : "border border-white/10 text-muted-foreground"}`}>
                {c === "All" ? <><FolderOpen className="mr-1 inline h-3 w-3" />All</> : c}
              </button>
            ))}
          </div>

          {loading ? <div className="py-10 text-center text-xs text-muted-foreground">Loading…</div> : filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground">No designs yet. Create one and save it!</div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((d) => {
                const tpl = TEMPLATE_MAP[d.template_id];
                return (
                  <button key={d.id} onClick={() => onOpen(d)} className="group relative flex flex-col rounded-xl border border-white/10 bg-white/5 p-2 text-left hover:border-primary">
                    <div className="flex h-24 items-center justify-center">
                      {d.thumbnail ? <img src={d.thumbnail} alt={d.name} className="h-24 w-full rounded-md object-contain" /> : tpl && (
                        <svg viewBox={tpl.viewBox} className="h-20 w-20">
                          {tpl.groups.map((g) => <path key={g.id} d={g.d} fill={g.role === "detail" ? "none" : (d.state?.color || tpl.defaultColor)} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />)}
                        </svg>
                      )}
                    </div>
                    <span className="mt-1 truncate text-xs font-medium">{d.name}</span>
                    <span className="font-mono text-[9px] text-muted-foreground">{tpl?.name || d.category} · v{d.version || 1}</span>
                    <div className="absolute right-1 top-1 flex gap-1">
                      <span onClick={(e) => toggleFav(d, e)} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur"><Star className={`h-3 w-3 ${d.favorite ? "fill-yellow-400 text-yellow-400" : "text-white/70"}`} /></span>
                      <span onClick={(e) => remove(d, e)} className="flex h-6 w-6 items-center justify-center rounded-full bg-black/40 backdrop-blur"><Trash2 className="h-3 w-3 text-white/70" /></span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}