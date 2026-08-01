import React, { useEffect, useState, useCallback } from "react";
import { History, Camera, RotateCcw, Trash2, Loader2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Image } from "@/components/ui/image";

export default function VersionHistory({ open, onClose, designId, activeVersion, onCreateSnapshot, onRestore }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!designId) { setVersions([]); return; }
    setLoading(true);
    try {
      const list = await base44.entities.GarmentVersion.filter({ design_id: designId }, "-version_number", 50);
      setVersions(list || []);
    } catch { setVersions([]); }
    finally { setLoading(false); }
  }, [designId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleCreate = async () => {
    setBusy(true);
    try { await onCreateSnapshot(); await load(); } finally { setBusy(false); }
  };

  const handleRestore = async (v) => {
    setBusy(true);
    try { await onRestore(v); onClose(); } finally { setBusy(false); }
  };

  const handleDelete = async (v) => {
    try { await base44.entities.GarmentVersion.delete(v.id); setVersions((prev) => prev.filter((x) => x.id !== v.id)); } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full border-white/10 bg-card p-0 sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between border-b border-white/10 px-4 py-3">
          <SheetTitle className="font-heading text-sm font-bold tracking-tight">Version History</SheetTitle>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </SheetHeader>

        <div className="border-b border-white/10 p-3">
          <button onClick={handleCreate} disabled={busy || !designId}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-40">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            Create Snapshot
          </button>
          {!designId && <p className="mt-2 text-center text-[10px] text-muted-foreground">Save the design first to capture snapshots.</p>}
        </div>

        <div className="fit-scroll flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <History className="h-8 w-8 text-muted-foreground/40" strokeWidth={1.2} />
              <p className="text-xs text-muted-foreground">No snapshots yet.<br />Capture a snapshot to preserve this design's state.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className={`fit-glass group flex gap-3 rounded-xl border p-2.5 ${v.version_number === activeVersion ? "border-primary/60" : "border-white/10"}`}>
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-black/30">
                    {v.thumbnail ? <Image src={v.thumbnail} fittingType="fill" className="h-full w-full" /> : <div className="flex h-full items-center justify-center"><History className="h-5 w-5 text-muted-foreground/40" /></div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary">v{v.version_number}</span>
                      {v.version_number === activeVersion && <span className="text-[10px] font-medium text-emerald-400">current</span>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-foreground/90">{v.name || v.snapshot?.design_name || "Untitled"}</p>
                    <p className="font-mono text-[9px] text-muted-foreground/70">{new Date(v.created_date).toLocaleString()}</p>
                    <div className="mt-1.5 flex gap-1.5">
                      <button onClick={() => handleRestore(v)} disabled={busy} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-40">
                        <RotateCcw className="h-3 w-3" /> Restore
                      </button>
                      <button onClick={() => handleDelete(v)} disabled={busy} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 text-[10px] text-muted-foreground hover:border-destructive hover:text-destructive disabled:opacity-40">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}