import React, { useState, useEffect } from "react";
import { Loader2, Trash2, Download, Images, FileText, Film, Music2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Image } from "@/components/ui/image";

const KIND_ICON = { image: Images, video: Film, essay: FileText, audio: Music2, song: Music2 };
const FILTERS = [["all", "All"], ["image", "Images"], ["video", "Videos"], ["essay", "Essays"], ["audio", "Audio"]];

export default function GalleryPanel({ open, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.GalleryItem.list("-created_date", 100);
      setItems(list || []);
    } catch { setItems([]); } finally { setLoading(false); }
  };
  useEffect(() => { if (open) load(); }, [open]);

  const del = async (id) => {
    try { await base44.entities.GalleryItem.delete(id); setItems((s) => s.filter((x) => x.id !== id)); } catch {}
  };

  const download = async (item) => {
    if (item.kind === "essay") {
      const blob = new Blob([item.content || ""], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `${(item.title || "essay").replace(/[^a-z0-9-_ ]/gi, "")}.txt`; a.click();
      URL.revokeObjectURL(url); return;
    }
    try {
      const res = await fetch(item.url); const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `${(item.title || item.kind).replace(/[^a-z0-9-_ ]/gi, "")}.${item.kind === "video" ? "mp4" : item.kind === "audio" ? "mp3" : "png"}`;
      a.click(); URL.revokeObjectURL(url);
    } catch { window.open(item.url, "_blank"); }
  };

  const filtered = filter === "all" ? items : items.filter((i) => (filter === "audio" ? i.kind === "audio" || i.kind === "song" : i.kind === filter));

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto">
        <SheetHeader><SheetTitle className="flex items-center gap-2"><Images className="h-4 w-4 text-primary" /> Gallery</SheetTitle></SheetHeader>
        <div className="flex gap-1.5 px-2 pb-2">
          {FILTERS.map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} className={`rounded-full px-3 py-1 text-xs ${filter === id ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground hover:text-foreground"}`}>{label}</button>
          ))}
        </div>
        <div className="space-y-3 p-3">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No creations yet. Ask Jabber to write an essay, generate an image, video, or audio.</p>
          ) : (
            filtered.map((item) => {
              const Icon = KIND_ICON[item.kind] || Images;
              return (
                <div key={item.id} className="overflow-hidden rounded-xl border border-border/50 bg-background/40">
                  <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="flex-1 truncate text-sm font-medium">{item.title}</span>
                    <button onClick={() => download(item)} className="rounded-md border border-border/60 p-1.5 hover:border-primary" title="Export"><Download className="h-3 w-3" /></button>
                    <button onClick={() => del(item.id)} className="rounded-md border border-destructive/40 p-1.5 text-destructive hover:bg-destructive/5" title="Delete"><Trash2 className="h-3 w-3" /></button>
                  </div>
                  <div className="p-3">
                    {item.kind === "image" && item.url && (
                      <a href={item.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg"><Image src={item.url} alt={item.title} fittingType="fill" className="h-40 w-full" /></a>
                    )}
                    {item.kind === "video" && item.url && <video src={item.url} controls className="w-full rounded-lg" />}
                    {(item.kind === "audio" || item.kind === "song") && item.url && <audio src={item.url} controls className="w-full" />}
                    {item.kind === "essay" && <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-foreground/5 p-2 text-xs leading-relaxed text-foreground/80">{item.content}</pre>}
                    {item.prompt && <p className="mt-2 font-mono text-[10px] text-muted-foreground">prompt: {item.prompt.slice(0, 120)}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}