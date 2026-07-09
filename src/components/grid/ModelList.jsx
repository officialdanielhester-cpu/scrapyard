import React from "react";
import { Box as BoxIcon } from "lucide-react";

export default function ModelList({ models, onOpen }) {
  return (
    <div className="divide-y divide-border/40 overflow-hidden rounded-2xl border border-border/50">
      {models.map((m) => (
        <button
          key={m.id}
          onClick={() => onOpen(m)}
          className="flex w-full items-center gap-4 bg-card/40 px-4 py-3 text-left transition-colors hover:bg-secondary/40"
        >
          <div
            className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border/50"
            style={{ backgroundColor: m.bgColor || "#080B14" }}
          >
            {m.image_url ? (
              <img src={m.image_url} alt={m.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <BoxIcon className="h-5 w-5 text-primary" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{m.name}</p>
            <p className="truncate text-xs text-muted-foreground">{m.prompt || "—"}</p>
          </div>
          <div className="flex items-center gap-3 text-right">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.mode === "2d" ? "2D" : m.geometry || "3d"}
            </span>
            {(m.markup || []).length > 0 && (
              <span className="font-mono text-[10px] text-primary">{m.markup.length} mark</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}