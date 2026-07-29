import React, { useEffect } from "react";

const NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const ROW = "awsdfghjkl;'";

export default function PianoKeyboard({ onNote }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const idx = ROW.indexOf(e.key.toLowerCase());
      if (idx >= 0) { e.preventDefault(); onNote(48 + idx); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNote]);

  const keys = [];
  for (let i = 0; i < 24; i++) keys.push(48 + i);

  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Tap a key or use your keyboard (A–; row). Drops a piano clip at the playhead.</p>
      <div className="flex h-24 overflow-x-auto rounded-lg border border-border/40 bg-background/30">
        {keys.map((midi, i) => {
          const isSharp = NAMES[i % 12].includes("#");
          return (
            <button key={i} onPointerDown={(e) => { e.preventDefault(); onNote(midi); }}
              className={`relative flex-1 min-w-[26px] border-r border-border/40 transition-colors hover:bg-primary/30 active:bg-primary/40 ${isSharp ? "bg-foreground/15" : "bg-background/60"}`}>
              <span className="absolute bottom-1 left-1 font-mono text-[9px] text-muted-foreground">{NAMES[i % 12]}{Math.floor(midi / 12) - 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}