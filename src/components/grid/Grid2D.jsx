import React from "react";
import { Box, Sparkles } from "lucide-react";

export default function Grid2D({ items }) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
        <Box className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">The grid is empty</p>
        <p className="mt-1 text-sm text-muted-foreground/70">Import a model or create one with AI</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-card"
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-secondary/40">
              <Box className="h-10 w-10 text-muted-foreground" strokeWidth={1} />
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60">
                3D Model
              </span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <p className="truncate text-xs font-medium text-white">{item.name}</p>
            <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-white/60">
              {item.type === "ai" ? (
                <>
                  <Sparkles className="h-2.5 w-2.5" /> AI Generated
                </>
              ) : (
                "Imported"
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}