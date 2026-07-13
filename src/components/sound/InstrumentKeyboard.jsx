import React, { useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import SoundEngine, { INSTRUMENTS } from "@/components/sound/SoundEngine";

// Instrument families — selecting one surfaces its siblings as quick-switch chips.
const FAMILIES = [
  { label: "Keys", members: ["piano", "fm", "organ", "bell"] },
  { label: "Bass", members: ["bass", "acid", "wobble"] },
  { label: "Leads", members: ["lead", "sawlead", "square", "brass"] },
  { label: "Pads & Strings", members: ["strings", "choir", "pad", "pluck", "arp"] },
  { label: "World", members: ["kalimba", "music_box", "sitar"] },
];
const familyOf = (id) => FAMILIES.find((f) => f.members.includes(id));

// Two octaves of white keys (semitone offset from C4) with labels.
const WHITE = [
  { semi: 0, label: "C" }, { semi: 2, label: "D" }, { semi: 4, label: "E" }, { semi: 5, label: "F" },
  { semi: 7, label: "G" }, { semi: 9, label: "A" }, { semi: 11, label: "B" },
  { semi: 12, label: "C" }, { semi: 14, label: "D" }, { semi: 16, label: "E" }, { semi: 17, label: "F" },
  { semi: 19, label: "G" }, { semi: 21, label: "A" }, { semi: 23, label: "B" },
];
const BLACK = [
  { semi: 1, after: 0 }, { semi: 3, after: 1 }, { semi: 6, after: 3 }, { semi: 8, after: 4 }, { semi: 10, after: 5 },
  { semi: 13, after: 7 }, { semi: 15, after: 8 }, { semi: 18, after: 10 }, { semi: 20, after: 11 }, { semi: 22, after: 12 },
];
const KEY_MAP = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11,
  k: 12, o: 13, l: 14, p: 15, ";": 16,
};

export default function InstrumentKeyboard({ instrument, setInstrument, vol }) {
  const [octave, setOctave] = useState(0);
  const [active, setActive] = useState(null);

  const play = useCallback((semi) => {
    SoundEngine.playKey(instrument, semi + octave * 12, vol, 0);
    setActive(semi + octave * 12);
    setTimeout(() => setActive((a) => (a === semi + octave * 12 ? null : a)), 220);
  }, [instrument, octave, vol]);

  useEffect(() => {
    const down = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k in KEY_MAP) { e.preventDefault(); play(KEY_MAP[k]); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [play]);

  const whiteW = 100 / WHITE.length;
  const blackW = whiteW * 0.62;
  const inst = INSTRUMENTS.find((i) => i.id === instrument);
  const accent = inst?.color || "#3b82f6";

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => setOctave((o) => Math.max(-2, o - 1))} className="rounded-md border border-border/50 p-1.5 hover:bg-foreground/5">
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
          </button>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Oct {octave}</span>
          <button onClick={() => setOctave((o) => Math.min(2, o + 1))} className="rounded-md border border-border/50 p-1.5 hover:bg-foreground/5">
            <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">Piano · {inst?.name}</span>
        <span className="ml-auto hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 md:block">Type A–K to play</span>
      </div>

      {/* Sibling instruments in the selected family */}
      {familyOf(instrument) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{familyOf(instrument).label}</span>
          <div className="flex flex-wrap gap-1.5">
            {familyOf(instrument).members.map((id) => {
              const m = INSTRUMENTS.find((i) => i.id === id);
              if (!m) return null;
              const on = id === instrument;
              return (
                <button
                  key={id}
                  onClick={() => setInstrument(id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                    on ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-foreground/70 hover:border-primary hover:text-primary"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative select-none">
        {/* White keys */}
        <div className="flex">
          {WHITE.map((k) => {
            const semi = k.semi + octave * 12;
            const on = active === semi;
            return (
              <button
                key={k.semi}
                onPointerDown={(e) => { e.preventDefault(); play(k.semi); }}
                className="relative flex flex-1 items-end justify-center rounded-b-md border border-border/60 pb-2 text-[9px] text-foreground/40 transition-colors"
                style={{ height: 120, background: on ? accent : "#ffffff" }}
              >
                <span className={on ? "font-semibold text-white" : ""}>{k.label}</span>
              </button>
            );
          })}
        </div>

        {/* Black keys */}
        <div className="pointer-events-none absolute inset-0 flex">
          {WHITE.map((k, i) => (
            <div key={k.semi} className="relative" style={{ width: `${whiteW}%` }}>
              {BLACK.filter((b) => b.after === i).map((b) => {
                const semi = b.semi + octave * 12;
                const on = active === semi;
                return (
                  <button
                    key={b.semi}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); play(b.semi); }}
                    className="pointer-events-auto absolute rounded-b-sm border border-black/80"
                    style={{
                      width: `${blackW}%`,
                      height: 72,
                      right: `-${blackW / 2}%`,
                      background: on ? accent : "#111111",
                      zIndex: 2,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}