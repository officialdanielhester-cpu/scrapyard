import React, { useState, useEffect } from "react";
import { Layers } from "lucide-react";
import { WORKSPACE_META, getRecentWorkspaces, relativeDate } from "./workspace-data";

const FALLBACK = ["sound", "grid", "fit-maker", "mind-mapper"];

export default function RecentWorkspaces({ onNavigate, currentWorkspace }) {
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const stored = getRecentWorkspaces();
    const filtered = stored.filter((w) => w.id !== currentWorkspace);
    if (filtered.length < 4) {
      const seen = new Set(filtered.map((w) => w.id));
      const fill = FALLBACK.filter((id) => !seen.has(id) && id !== currentWorkspace);
      setRecent([...filtered, ...fill.map((id) => ({ id, ts: 0 }))].slice(0, 6));
    } else {
      setRecent(filtered.slice(0, 6));
    }
  }, [currentWorkspace]);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Workspaces
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {recent.map((ws) => {
          const meta = WORKSPACE_META[ws.id];
          if (!meta) return null;
          return (
            <button
              key={ws.id}
              onClick={() => onNavigate(ws.id)}
              className="flex flex-col items-start gap-2 rounded-xl border border-border/40 bg-card/50 p-3 transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <meta.Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">{meta.label}</p>
                <p className="text-[10px] text-muted-foreground">
                  {ws.ts ? relativeDate(new Date(ws.ts).toISOString()) : "Open"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}