import React, { useState, useEffect } from "react";
import { X, Copy, Trash2, FileCode2, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Slide-over panel listing code files Jabber has generated and saved.
export default function CodeLibrary({ open, onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.CodeFile.list("-created_date", 100);
      setFiles(list || []);
    } catch {
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      load();
      setOpenId(null);
    }
  }, [open]);

  const del = async (id) => {
    try {
      await base44.entities.CodeFile.delete(id);
      setFiles((f) => f.filter((x) => x.id !== id));
      if (openId === id) setOpenId(null);
    } catch {}
  };

  const copy = (content) => {
    try {
      navigator.clipboard?.writeText(content || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-border/60 bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background px-5 py-4">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-heading text-sm font-bold">Code Library</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No saved code yet. Ask Jabber to write code and it'll show up here.
            </p>
          ) : (
            files.map((f) => (
              <div key={f.id} className="overflow-hidden rounded-xl border border-border/50">
                <button
                  onClick={() => setOpenId(openId === f.id ? null : f.id)}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-foreground/5"
                >
                  <FileCode2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <span className="flex-1 truncate text-sm font-medium">{f.name}</span>
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">{f.language}</span>
                </button>
                {openId === f.id && (
                  <div className="border-t border-border/40 p-3">
                    {f.description && <p className="mb-2 text-xs text-muted-foreground">{f.description}</p>}
                    <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-foreground/5 p-3 font-mono text-[11px] leading-relaxed text-foreground/80">
                      {f.content}
                    </pre>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => copy(f.content)}
                        className="flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5 text-xs transition-colors hover:border-primary hover:text-primary"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button
                        onClick={() => del(f.id)}
                        className="flex items-center gap-1.5 rounded-md border border-destructive/40 px-2.5 py-1.5 text-xs text-destructive transition-colors hover:bg-destructive/5"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}