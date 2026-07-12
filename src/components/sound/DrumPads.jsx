import React, { useState, useEffect, useRef } from "react";
import SoundEngine, { INSTRUMENTS } from "@/components/sound/SoundEngine";

const colorOf = (id) => INSTRUMENTS.find((i) => i.id === id)?.color || "#64748b";

// 8 velocity pads across the percussion voices (Tom Hi = tom +7 semitones).
const PADS = [
  { id: "kick", name: "Kick", key: "1" },
  { id: "snare", name: "Snare", key: "2" },
  { id: "clap", name: "Clap", key: "3" },
  { id: "cowbell", name: "Cowbell", key: "4" },
  { id: "hihat", name: "Hi-Hat", key: "q" },
  { id: "openhat", name: "Open Hat", key: "w" },
  { id: "tom", name: "Tom Lo", key: "e", semi: 0 },
  { id: "tom", name: "Tom Hi", key: "r", semi: 7 },
];

export default function DrumPads({ vol }) {
  const [active, setActive] = useState(null);
  const volRef = useRef(vol);
  useEffect(() => { volRef.current = vol; }, [vol]);

  const hit = (pad) => {
    SoundEngine.playKey(pad.id, pad.semi ?? 0, volRef.current, 0);
    setActive(pad.key);
    setTimeout(() => setActive((a) => (a === pad.key ? null : a)), 160);
  };

  useEffect(() => {
    const down = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const pad = PADS.find((p) => p.key === k);
      if (pad) { e.preventDefault(); hit(pad); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Drum Pads · 8 voices</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 md:block">Tap pads or press 1–4 · Q–R</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {PADS.map((pad) => {
          const on = active === pad.key;
          const color = colorOf(pad.id);
          return (
            <button
              key={pad.key}
              onPointerDown={(e) => { e.preventDefault(); hit(pad); }}
              className={`relative flex aspect-square select-none flex-col items-center justify-center rounded-xl border transition-all duration-75 ${
                on ? "scale-95 border-transparent text-white" : "border-border/50 text-foreground/90 hover:border-foreground/40"
              }`}
              style={on
                ? { background: color, boxShadow: `0 0 26px ${color}66` }
                : { background: `${color}1f` }}
            >
              <span className="font-body text-xs font-semibold">{pad.name}</span>
              <span className="mt-1 font-mono text-[9px] uppercase opacity-60">{pad.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}