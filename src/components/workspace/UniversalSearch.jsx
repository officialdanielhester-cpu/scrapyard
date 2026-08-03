import React, { useState, useMemo } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { WORKSPACE_META } from "./workspace-data";

export default function UniversalSearch({ items, loading, onNavigate }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items.filter((i) => i.label?.toLowerCase().includes(q)).slice(0, 8);
  }, [query, items]);

  return (
    <div className="relative mx-auto max-w-2xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="Search everything — projects, notes, designs, conversations…"
          className="w-full rounded-xl border border-border/50 bg-background/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {focused && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-xl border border-border/60 bg-popover shadow-2xl backdrop-blur-xl">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((r) => {
              const ws = WORKSPACE_META[r.workspace];
              return (
                <button
                  key={r.id}
                  onClick={() => { onNavigate(r.workspace); setQuery(""); setFocused(false); }}
                  className="flex w-full items-center gap-3 border-b border-border/30 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-primary/10"
                >
                  <r.Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{r.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {r.typeLabel}{ws ? ` · ${ws.label}` : ""}
                    </p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}