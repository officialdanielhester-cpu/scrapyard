import React from "react";
import { Boxes } from "lucide-react";

export default function Grid2D({ models, onOpen }) {
  if (!models || models.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
        <Boxes className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">The grid is empty</p>
        <p className="mt-1 text-sm text-muted-foreground/70">Tell Jabber what to make below</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {models.map((m) => (
        <button
          key={m.id}
          onClick={() => onOpen(m)}
          className="group relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-card text-left transition-transform duration-300 hover:scale-[1.02]"
        >
          {m.image_url ? (
            <img
              src={m.image_url}
              alt={m.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `radial-gradient(circle at 50% 42%, ${m.color || "#3B82F6"}40, transparent 72%)` }}
            >
              <span
                className="h-14 w-14 rotate-12 rounded-lg shadow-lg transition-transform duration-500 group-hover:rotate-45"
                style={{ background: m.color || "#3B82F6" }}
              />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
            <p className="truncate text-xs font-medium text-white">{m.name}</p>
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/60">
              {m.image_url ? "Image" : (m.geometry || "model")}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}