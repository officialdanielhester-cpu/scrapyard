import React, { useState, useEffect, useCallback } from "react";
import { Piano, Volume2, ChevronUp, ChevronDown } from "lucide-react";
import SoundEngine, { INSTRUMENTS } from "@/components/sound/SoundEngine";

const MELODIC = INSTRUMENTS.filter((i) => i.melodic && i.id !== "sample");

// Two octaves of white keys (semitone offset from C4) with labels.
const WHITE = [
  { semi: 0, label: "C" }, { semi: 2, label: "D" }, { semi: 4, label: "E" }, { semi: 5, label: "F" },
  { semi: 7, label: "G" }, { semi: 9, label: "A" }, { semi: 11, label: "B" },
  { semi: 12, label: "C" }, { semi: 14, label: "D" }, { semi: 16, label: "E" }, { semi: 17, label: "F" },
  { semi: 19, label: "G" }, { semi: 21, label: "A" }, { semi: 23, label: "B" },
];

// Black keys: semitone + index of the white key they sit after.
const BLACK = [
  { semi: 1, after: 0 }, { semi: 3, after: 1 }, { semi: 6, after: 3 },
  { semi: 8, after: 4 }, { semi: 10, after: 5 },
  { semi: 13, after: 7 }, { semi: 15, after: 8 }, { semi: 18, after: 10 },
  { semi: 20, after: 11 }, { semi: 22, after: 12 },
];

// Computer keyboard → first-octave semitones (A row = white, W/E/T/Y/U = black).
const KEY_MAP = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12,
};

export default function InstrumentKeyboard() {
  const [instrument, setInstrument] = useState("piano");
  const [vol, setVol] = useState(0.7);
  const [octave, setOctave] = useState(0);
  const [active, setActive] = useState(null);
  const inst = INSTRUMENTS.find((i) => i.id === instrument);

  const play = useCallback((semitone) => {
    SoundEngine.playKey(instrument, semitone + octave * 12, vol);
    setActive(semitone + octave * 12);
    const id = setTimeout(() => setActive((a) => (a === semitone + octave * 12 ? null : a)), 140);
    return () => clearTimeout(id);
  }, [instrument, vol, octave]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      const semi = KEY_MAP[e.key.toLowerCase()];
      if (semi !== undefined) { e.preventDefault(); play(semi); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [play]);

  const whiteW = 100 / WHITE.length;
  const blackW = whiteW * 0.62;

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Piano className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Live Play</span>
        </div>
        <select
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          className="rounded-lg border border-border/50 bg-background px-3 py-1.5 font-body text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {MELODIC.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="range" min="0" max="1" step="0.05" value={vol}
            onChange={(e) => setVol(Number(e.target.value))}
            className="h-1.5 w-20 cursor-pointer accent-primary"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 px-1 py-0.5">
          <button onClick={() => setOctave((o) => Math.max(-2, o - 1))} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-primary" aria-label="Octave down">
            <ChevronDown className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center font-mono text-[10px] uppercase text-muted-foreground">Oct {octave >= 0 ? `+${octave}` : octave}</span>
          <button onClick={() => setOctave((o) => Math.min(2, o + 1))} className="flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:text-primary" aria-label="Octave up">
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>
        <div className="ml-auto hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 md:block">
          Type A–K to play the first octave
        </div>
      </div>

      <div className="relative select-none">
        <div className="flex gap-px">
          {WHITE.map((k) => {
            const on = active === k.semi + octave * 12;
            return (
              <button
                key={k.semi}
                onPointerDown={() => play(k.semi)}
                className="flex-1 rounded-b-md border border-border/50 bg-card py-7 text-center font-mono text-[9px] text-muted-foreground transition-colors hover:bg-primary/5 active:bg-primary/10 sm:py-9"
                style={on ? { background: inst.color, color: "#fff", borderColor: inst.color } : {}}
              >
                {k.label}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-0">
          {BLACK.map((b) => {
            const left = (b.after + 1) * whiteW - blackW / 2;
            const on = active === b.semi + octave * 12;
            return (
              <button
                key={b.semi}
                onPointerDown={() => play(b.semi)}
                className="pointer-events-auto absolute top-0 rounded-b-md bg-zinc-900 transition-colors hover:bg-zinc-700"
                style={{
                  left: `${left}%`,
                  width: `${blackW}%`,
                  height: "62%",
                  ...(on ? { background: inst.color } : {}),
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}