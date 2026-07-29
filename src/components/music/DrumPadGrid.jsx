import React from "react";

const PAD_SAMPLES = ["drum", "pad", "bell", "noise", "drum", "pad", "bell", "noise", "drum", "pad", "bell", "noise", "drum", "pad", "bell", "noise"];

export default function DrumPadGrid({ onPad }) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tap a pad to drop a drum clip at the playhead.</p>
      <div className="grid grid-cols-4 gap-2">
        {PAD_SAMPLES.map((s, i) => (
          <button key={i} onPointerDown={(e) => { e.preventDefault(); onPad("builtin:" + s); }}
            className="flex aspect-square flex-col items-center justify-center rounded-lg border border-border/40 bg-gradient-to-br from-primary/20 to-primary/5 transition-colors hover:from-primary/30 active:from-primary/40">
            <span className="font-mono text-xs text-foreground/70">{i + 1}</span>
            <span className="font-mono text-[9px] text-muted-foreground">{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}