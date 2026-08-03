import React from "react";
import { Clock } from "lucide-react";
import { WORKSPACE_META, relativeDate } from "./workspace-data";

export default function ContinueWorking({ items, loading, onNavigate }) {
  const recent = items.slice(0, 6);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Continue Working
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/40 px-3 py-6 text-center text-xs text-muted-foreground">
          No projects yet — start creating in any workspace.
        </p>
      ) : (
        <div className="space-y-1">
          {recent.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.workspace)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors hover:bg-foreground/5"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/40">
                <item.Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.typeLabel} · {relativeDate(item.created_date)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}