import React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

// On-screen pitch steering for flying vehicles. Hold a button to pitch the
// thrust/lift vector and alter the trajectory. Pitch attitude is shown in degrees.
export default function SteeringControl({ pitchDeg, onSteer, onSteerEnd }) {
  const btn =
    "flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/80 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary select-none touch-none";
  return (
    <div className="steering flex flex-col items-center gap-1 rounded-2xl border border-border/60 bg-background/70 px-2 py-1.5 backdrop-blur">
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Steer</span>
      <div className="flex items-center gap-1.5">
        <button
          onPointerDown={(e) => { e.preventDefault(); onSteer(1); }}
          onPointerUp={onSteerEnd}
          onPointerLeave={onSteerEnd}
          onPointerCancel={onSteerEnd}
          className={btn}
          aria-label="Pitch up"
        >
          <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="flex w-10 flex-col items-center">
          <span className="font-mono text-[11px] font-semibold text-primary">{pitchDeg}°</span>
        </div>
        <button
          onPointerDown={(e) => { e.preventDefault(); onSteer(-1); }}
          onPointerUp={onSteerEnd}
          onPointerLeave={onSteerEnd}
          onPointerCancel={onSteerEnd}
          className={btn}
          aria-label="Pitch down"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}