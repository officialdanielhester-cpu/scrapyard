import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, CornerDownLeft } from "lucide-react";
import { WORKSPACE_META, relativeDate } from "./workspace-data";

const CATEGORIES = [
  "All", "Notes", "Music", "Designs", "Mind Maps",
  "Code", "Conversations", "Gallery", "Experiments", "Models", "Vehicles", "Projects",
];

export default function GlobalSearchOverlay({ open, onClose, items, loading, onNavigate }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setCategory("All");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const results = useMemo(() => {
    let r = items;
    if (category !== "All") r = r.filter((i) => i.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter((i) => i.label?.toLowerCase().includes(q));
    }
    return r.slice(0, 24);
  }, [items, query, category]);

  useEffect(() => { setSelectedIdx(0); }, [query, category]);

  useEffect(() => {
    if (selectedIdx >= 0 && resultsRef.current) {
      const el = resultsRef.current.children[selectedIdx];
      if (el) el.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIdx]);

  const handleKey = (e) => {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIdx]) {
      e.preventDefault();
      onNavigate(results[selectedIdx].workspace);
      onClose();
    }
  };

  const selectResult = (r) => { onNavigate(r.workspace); onClose(); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-background/80 px-4 pt-[8vh] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3.5">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Search everything…"
                className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-border/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:block">ESC</kbd>
            </div>

            {/* Category filters */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-border/40 px-4 py-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                    category === cat ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-foreground/5"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Results */}
            <div ref={resultsRef} className="max-h-[52vh] overflow-y-auto p-2">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="px-4 py-12 text-center text-sm text-muted-foreground">
                  Nothing to search yet — start creating in any workspace.
                </p>
              ) : results.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">
                  {query ? <>No results for &ldquo;{query}&rdquo;</> : "No items in this category."}
                </p>
              ) : (
                results.map((r, idx) => {
                  const ws = WORKSPACE_META[r.workspace];
                  return (
                    <button
                      key={r.id}
                      onClick={() => selectResult(r)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        idx === selectedIdx ? "bg-primary/10" : "hover:bg-foreground/5"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/40">
                        <r.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.typeLabel} · {ws?.label || r.workspace} · {relativeDate(r.created_date)}
                        </p>
                      </div>
                      {idx === selectedIdx && (
                        <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}