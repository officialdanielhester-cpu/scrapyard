import React, { useState, useEffect } from "react";
import { X, Loader2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Slide-over listing saved Model records; clicking one drops it into the workspace.
export default function ImportModelsPanel({ open, onClose, onImport }) {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    base44.entities.Model
      .list("-updated_date", 50)
      .then((list) => setModels(list || []))
      .catch(() => setModels([]))
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-border/60 bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background px-5 py-4">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-heading text-sm font-bold">Import Model</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : models.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No saved models yet. Create some in The Grid, then import them here.
            </p>
          ) : (
            models.map((m) => (
              <button
                key={m.id}
                onClick={() => { onImport(m); onClose(); }}
                className="flex w-full items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5 text-left transition-colors hover:border-primary hover:bg-foreground/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border/60" style={{ background: m.color || "#3b82f6" }}>
                  <span className="h-2 w-2 rounded-full bg-background/80" />
                </span>
                <span className="flex-1">
                  <span className="block truncate text-sm font-medium">{m.name}</span>
                  <span className="block font-mono text-[10px] uppercase text-muted-foreground">{m.geometry} · {m.mode || "3d"}</span>
                </span>
                <Download className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}