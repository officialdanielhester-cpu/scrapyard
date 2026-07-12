import React, { useState, useRef, useEffect } from "react";
import SoundEngine, { INSTRUMENTS, NOTE_NAMES } from "@/components/sound/SoundEngine";

const noteName = (semi) => NOTE_NAMES[((semi % 12) + 12) % 12];

export default function XYPad({ instrument, vol }) {
  const [pos, setPos] = useState(null);
  const instRef = useRef(instrument);
  const volRef = useRef(vol);
  const lastTrig = useRef(0);
  const lastSemi = useRef(null);
  const pressing = useRef(false);

  useEffect(() => { instRef.current = instrument; }, [instrument]);
  useEffect(() => { volRef.current = vol; }, [vol]);

  const trig = (x, y) => {
    const semi = Math.round(x * 24);
    const v = volRef.current * Math.max(0.1, 1 - y);
    const now = performance.now();
    if (semi !== lastSemi.current || now - lastTrig.current > 140) {
      SoundEngine.playKey(instRef.current, semi, v, 0);
      lastTrig.current = now;
      lastSemi.current = semi;
    }
  };

  const onDown = (e) => {
    e.preventDefault();
    pressing.current = true;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    trig(x, y);
    setPos({ x, y });
  };
  const onMove = (e) => {
    if (!pressing.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
    trig(x, y);
    setPos({ x, y });
  };
  const onUp = () => { pressing.current = false; setPos(null); lastSemi.current = null; };

  const semi = pos ? Math.round(pos.x * 24) : null;
  const voice = INSTRUMENTS.find((i) => i.id === instrument)?.name;

  return (
    <div className="rounded-2xl border border-border/40 bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">XY Pad · {voice}</span>
        <span className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50 md:block">Drag · X = pitch · Y = volume</span>
      </div>

      <div
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-primary/10 via-background to-background"
        style={{ cursor: "crosshair" }}
      >
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-30">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="border border-border/40" />
          ))}
        </div>

        {pos && (
          <>
            <div className="absolute h-px w-full bg-primary/40" style={{ top: `${pos.y * 100}%` }} />
            <div className="absolute h-full w-px bg-primary/40" style={{ left: `${pos.x * 100}%` }} />
            <div
              className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-primary/30 shadow-lg"
              style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
            />
          </>
        )}

        {semi !== null && (
          <div className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 font-mono text-[10px] text-primary backdrop-blur">
            {noteName(semi)}
          </div>
        )}
      </div>
    </div>
  );
}