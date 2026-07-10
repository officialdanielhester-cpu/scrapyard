import React from "react";
import PaintStudio from "@/components/grid/PaintStudio";

export default function GridSection() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-screen">
      <header className="flex shrink-0 items-center justify-between px-6 py-4 pt-[calc(env(safe-area-inset-top)+1rem)] md:px-10">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">The Grid</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Paint · Layer · Create
          </p>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <PaintStudio />
      </div>
    </div>
  );
}