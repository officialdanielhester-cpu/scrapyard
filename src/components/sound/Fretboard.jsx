import React, { useState, useEffect, useRef } from "react";
import SoundEngine, { INSTRUMENTS, NOTE_NAMES } from "@/components/sound/SoundEngine";

// Standard guitar tuning, high E (top) → low E (bottom). Semitone offsets from C4.
const STRINGS = [
  { label: "e", base: 4 },    // E4
  { label: "B", base: -1 },   // B3
  { label: "G", base: -5 },   // G3
  { label: "D", base: -10 },  // D3
  { label: "A", base: -15 },  // A2
  { label: "E", base: -20 },  // E2
];
const FRETS = 12;
const INLAY = new Set([3, 5, 7, 9, 12]);
const noteName = (semi) => NOTE_NAMES[((semi % 12) + 12) % 12];

export default function Fretboard({ instrument, vol }) {
  const [active, setActive] = useState(null);
  const instRef = useRef(instrument);
  const volRef = useRef(vol);
  useEffect(() => { instRef.current = instrument; }, [instrument]);
  useEffect(() => { volRef.current = vol; }, [vol]);

  const play = (s, f) => {
    const semi = STRINGS[s].base + f;
    SoundEngine.playKey(instRef.current, semi, volRef.current, 0);
    const id = `${s}-${f}`;
    setActive(id);
    setTimeout(() => setActive((a) => (a === id ? null : a)), 200);
  };

  const voice = INSTRUMENTS.find((i) => i.id === instrument)?.name;

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Fretboard · {voice}</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 md:block">Tap a fret to play · open strings on the left</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border/40 bg-secondary">
        <div className="min-w-[620px]">
          {/* Fret number header with inlay dots */}
          <div className="flex border-b border-border/40">
            <div className="w-8 shrink-0" />
            {Array.from({ length: FRETS }).map((_, f) => (
              <div key={f} className="relative flex flex-1 items-center justify-center py-1.5 font-mono text-[9px] text-muted-foreground/60">
                {f + 1}
                {INLAY.has(f + 1) && (
                  <span className="absolute h-1.5 w-1.5 rounded-full bg-foreground/25" style={{ top: "-3px" }} />
                )}
              </div>
            ))}
          </div>

          {/* Strings */}
          {STRINGS.map((str, s) => (
            <div key={s} className="flex border-b border-border/30 last:border-0" style={{ height: 34 }}>
              <button
                onPointerDown={(e) => { e.preventDefault(); play(s, 0); }}
                className={`flex w-8 shrink-0 items-center justify-center border-r border-border/40 font-mono text-[10px] ${
                  active === `${s}-0` ? "text-primary" : "text-foreground/70"
                }`}
              >
                {str.label}
              </button>
              {Array.from({ length: FRETS }).map((_, f) => {
                const id = `${s}-${f + 1}`;
                const on = active === id;
                return (
                  <button
                    key={f}
                    onPointerDown={(e) => { e.preventDefault(); play(s, f + 1); }}
                    className={`relative flex flex-1 items-center justify-center border-r border-border/30 transition-colors ${
                      on ? "bg-primary/30" : "hover:bg-foreground/5"
                    }`}
                  >
                    <span className="h-px w-full bg-foreground/20" />
                    {on && (
                      <span className="absolute font-mono text-[8px] text-primary">{noteName(str.base + f + 1)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}