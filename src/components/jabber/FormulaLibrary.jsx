import React, { useState, useMemo } from "react";
import { Sigma, Atom, FlaskConical, Search, X, Plus } from "lucide-react";
import { FORMULA_DISCIPLINES } from "@/components/jabber/formulas";

const DISCIPLINE_ICON = { math: Sigma, physics: Atom, chemistry: FlaskConical };

function FormulaCard({ f, onInsert }) {
  return (
    <button
      onClick={() => onInsert(f.eq)}
      className="block w-full rounded-xl border border-border/50 bg-card/60 p-3 text-left transition-colors hover:border-primary/60 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-foreground">{f.name}</p>
        <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
      </div>
      <p className="mt-1.5 break-words font-mono text-sm font-semibold text-primary">{f.eq}</p>
      {f.desc && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{f.desc}</p>}
    </button>
  );
}

export default function FormulaLibrary({ open, onClose, onInsert }) {
  const [query, setQuery] = useState("");
  const [disciplineId, setDisciplineId] = useState("math");

  const flat = useMemo(() => {
    const out = [];
    FORMULA_DISCIPLINES.forEach((d) => {
      d.categories.forEach((c) => {
        c.formulas.forEach((f) => out.push({ ...f, discipline: d.label, category: c.label }));
      });
    });
    return out;
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return flat.filter((f) =>
      [f.name, f.eq, f.desc, f.category, f.discipline].some((s) => (s || "").toLowerCase().includes(q))
    );
  }, [query, flat]);

  if (!open) return null;

  const activeDiscipline = FORMULA_DISCIPLINES.find((d) => d.id === disciplineId) || FORMULA_DISCIPLINES[0];

  return (
    <div className="absolute inset-0 z-30 flex justify-end">
      <div className="absolute inset-0 bg-black/30 animate-in fade-in" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-border/60 bg-background shadow-2xl animate-in slide-in-from-right">
        <header className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold tracking-tight">Formula Library</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Math · Science · Always On</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="border-b border-border/40 px-5 py-3">
          <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 150+ formulas…"
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {!query && (
          <div className="flex gap-1 border-b border-border/40 px-4 py-2">
            {FORMULA_DISCIPLINES.map((d) => {
              const Icon = DISCIPLINE_ICON[d.id] || Sigma;
              const active = d.id === disciplineId;
              return (
                <button
                  key={d.id}
                  onClick={() => setDisciplineId(d.id)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} /> {d.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {query && results.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No formulas match “{query}”.</p>
          ) : query ? (
            <div className="space-y-2">
              {results.map((f) => (
                <FormulaCard key={f.id} f={f} onInsert={onInsert} />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {activeDiscipline.categories.map((c) => (
                <div key={c.id}>
                  <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{c.label}</h3>
                  <div className="space-y-2">
                    {c.formulas.map((f) => (
                      <FormulaCard key={f.id} f={f} onInsert={onInsert} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border/40 px-5 py-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Tap a formula to drop it into the chat
          </p>
        </div>
      </aside>
    </div>
  );
}