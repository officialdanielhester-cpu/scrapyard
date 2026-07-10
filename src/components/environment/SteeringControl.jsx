import React from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

// Unified steering D-pad — adapts to vehicle category.
// Flyers (launch/winged/rotor): vertical = pitch, horizontal = yaw
// Ground: vertical = throttle, horizontal = turn
// axis "v" = vertical buttons, "h" = horizontal buttons; dir +1/-1.
export default function SteeringControl({ category, onInput, onEnd, pitchDeg, yawDeg, headingDeg, throttlePct }) {
  const isGround = category === "ground";
  const vLabel = isGround ? "Throttle" : "Pitch";
  const hLabel = isGround ? "Turn" : "Yaw";
  const vVal = isGround ? `${Math.round((throttlePct || 0) * 100)}%` : `${pitchDeg ?? 0}°`;
  const hVal = isGround ? `${headingDeg ?? 0}°` : `${yawDeg ?? 0}°`;
  const btn =
    "flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary active:bg-primary active:text-primary-foreground select-none touch-none";
  const hold = (axis, dir) => ({
    onPointerDown: (e) => { e.preventDefault(); onInput?.(axis, dir); },
    onPointerUp: onEnd,
    onPointerLeave: onEnd,
    onPointerCancel: onEnd,
  });

  return (
    <div className="steering flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 backdrop-blur">
      <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Steer</span>
      <button {...hold("v", 1)} className={btn} aria-label={`${vLabel} up`}>
        <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <div className="flex items-center gap-1.5">
        <button {...hold("h", -1)} className={btn} aria-label={`${hLabel} left`}>
          <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <div className="flex w-16 flex-col items-center">
          <span className="font-mono text-[11px] font-semibold text-primary">{vVal}</span>
          <span className="font-mono text-[8px] uppercase tracking-wider text-muted-foreground">{vLabel}</span>
        </div>
        <button {...hold("h", 1)} className={btn} aria-label={`${hLabel} right`}>
          <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
      <button {...hold("v", -1)} className={btn} aria-label={`${vLabel} down`}>
        <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
      </button>
      <div className="flex w-full items-center justify-between font-mono text-[9px] text-muted-foreground">
        <span>{hLabel}</span>
        <span className="text-primary">{hVal}</span>
      </div>
    </div>
  );
}