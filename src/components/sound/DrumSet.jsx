import React, { useState, useEffect, useRef } from "react";
import SoundEngine, { INSTRUMENTS } from "@/components/sound/SoundEngine";

const colorOf = (id) => INSTRUMENTS.find((i) => i.id === id)?.color || "#64748b";
const CYM = "#c9a227";

// Straight-on playable drum kit. Each piece is tappable and mapped to a key.
const KIT = [
  { id: "crash",   name: "Crash",    key: "k", semi: 0,  shape: "cym",  pos: { left: "72%", top: "12%" }, size: 84 },
  { id: "ride",    name: "Ride",     key: "l", semi: 0,  shape: "cym",  pos: { left: "86%", top: "40%" }, size: 86 },
  { id: "tom",     name: "Tom 1",    key: "f", semi: 4,  shape: "tom",  pos: { left: "38%", top: "18%" }, size: 56 },
  { id: "tom",     name: "Tom 2",    key: "g", semi: 0,  shape: "tom",  pos: { left: "54%", top: "14%" }, size: 60 },
  { id: "tom",     name: "Floor",    key: "d", semi: -5, shape: "tom",  pos: { left: "68%", top: "46%" }, size: 70 },
  { id: "snare",   name: "Snare",    key: "h", semi: 0,  shape: "drum", pos: { left: "26%", top: "52%" }, size: 72 },
  { id: "hihat",   name: "Hi-Hat",   key: "j", semi: 0,  shape: "cym",  pos: { left: "12%", top: "32%" }, size: 66 },
  { id: "openhat", name: "Open Hat", key: "u", semi: 0,  shape: "cym",  pos: { left: "14%", top: "60%" }, size: 56 },
  { id: "cowbell", name: "Cowbell",  key: "s", semi: 0,  shape: "aux",  pos: { left: "42%", top: "40%" }, size: 36 },
  { id: "kick",    name: "Kick",     key: " ", semi: 0,  shape: "kick", pos: { left: "50%", top: "78%" }, size: 100 },
];

export default function DrumSet({ vol }) {
  const [active, setActive] = useState(null);
  const volRef = useRef(vol);
  useEffect(() => { volRef.current = vol; }, [vol]);

  const hit = (piece) => {
    SoundEngine.playKey(piece.id, piece.semi ?? 0, volRef.current, 0);
    setActive(piece.key);
    setTimeout(() => setActive((a) => (a === piece.key ? null : a)), 170);
  };

  useEffect(() => {
    const down = (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key === " " ? " " : e.key.toLowerCase();
      const piece = KIT.find((p) => p.key === k);
      if (piece) { e.preventDefault(); hit(piece); }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Drum Set · {KIT.length} pieces</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 md:block">Tap a piece or use keys · Space = Kick</span>
      </div>
      <div className="relative mx-auto aspect-[16/10] w-full max-w-2xl">
        {KIT.map((p) => {
          const on = active === p.key;
          const color = colorOf(p.id);
          const base = p.shape === "cym" ? CYM : color;
          const isCym = p.shape === "cym";
          const isKick = p.shape === "kick";
          const h = isCym ? p.size * 0.34 : p.size;
          return (
            <button
              key={p.name}
              onPointerDown={(e) => { e.preventDefault(); hit(p); }}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 select-none flex-col items-center justify-center rounded-full border text-center transition-all duration-75 ${on ? "scale-95" : "hover:scale-[1.03]"}`}
              style={{
                ...p.pos,
                width: p.size,
                height: h,
                background: isCym
                  ? "radial-gradient(ellipse at 50% 40%, #e8c873dd, #b8943f55 60%, transparent 72%)"
                  : isKick
                  ? `radial-gradient(circle at 50% 42%, ${color}cc, #0b0f1a 72%)`
                  : `radial-gradient(circle at 50% 38%, ${color}f2, ${color}66 72%)`,
                borderColor: on ? base : "rgba(255,255,255,0.16)",
                boxShadow: on ? `0 0 28px ${base}aa, 0 6px 16px rgba(0,0,0,0.35)` : "0 6px 16px rgba(0,0,0,0.35)",
              }}
            >
              <span className="font-body text-[11px] font-semibold text-white drop-shadow">{p.name}</span>
              <span className="font-mono text-[9px] uppercase text-white/70">{p.key === " " ? "␣" : p.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}