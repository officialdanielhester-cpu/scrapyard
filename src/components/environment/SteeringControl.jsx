import React, { useRef } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, GripVertical, RotateCcw } from "lucide-react";

// Unified steering D-pad — adapts to vehicle category.
// Flyers (launch/winged/rotor): vertical = pitch, horizontal = yaw
// Ground: vertical = throttle, horizontal = turn
// Each axis is independent, so throttle+turn / pitch+yaw can combine.
// The pad floats over the sim: drag the header to reposition, use the slider to resize.
export default function SteeringControl({
  category, onInput, onEnd, pitchDeg, yawDeg, headingDeg, throttlePct,
  size = 1, onSizeChange, onReset,
  pos, onPosChange, bounds,
}) {
  const isGround = category === "ground";
  const vLabel = isGround ? "Throttle" : "Pitch";
  const hLabel = isGround ? "Turn" : "Yaw";
  const vVal = isGround ? `${Math.round((throttlePct || 0) * 100)}%` : `${pitchDeg ?? 0}°`;
  const hVal = isGround ? `${headingDeg ?? 0}°` : `${yawDeg ?? 0}°`;
  const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  const b = 40 * size;   // button size
  const ic = 20 * size;  // icon size
  const g = 6 * size;    // gap

  const btnBase =
    "flex items-center justify-center rounded-xl border border-border/60 bg-background/80 text-foreground backdrop-blur transition-colors hover:border-primary hover:text-primary active:bg-primary active:text-primary-foreground select-none touch-none";

  // Pointer capture keeps a hold alive even if the finger drifts off the button,
  // and only the released axis is cleared so combos stay active.
  const hold = (axis, dir) => ({
    onPointerDown: (e) => {
      e.preventDefault();
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
      onInput?.(axis, dir);
    },
    onPointerUp: (e) => {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
      onEnd?.(axis);
    },
    onPointerCancel: () => onEnd?.(axis),
  });

  const onHeaderDown = (e) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: pos?.left ?? 0, oy: pos?.top ?? 0 };
  };
  const onHeaderMove = (e) => {
    if (!drag.current.active) return;
    const w = bounds?.w || 600, h = bounds?.h || 460;
    const left = Math.max(0, Math.min(w, drag.current.ox + (e.clientX - drag.current.sx)));
    const top = Math.max(0, Math.min(h, drag.current.oy + (e.clientY - drag.current.sy)));
    onPosChange?.({ left, top });
  };
  const onHeaderUp = (e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    drag.current.active = false;
  };

  return (
    <div
      className="steering pointer-events-auto absolute z-30 flex flex-col gap-1.5 rounded-2xl border border-border/60 bg-background/70 px-3 py-2 backdrop-blur touch-none"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, transform: "translate(-50%, -50%)" }}
    >
      <div
        onPointerDown={onHeaderDown}
        onPointerMove={onHeaderMove}
        onPointerUp={onHeaderUp}
        className="flex cursor-grab items-center gap-2 active:cursor-grabbing"
      >
        <GripVertical className="text-muted-foreground" style={{ width: ic * 0.8, height: ic * 0.8 }} strokeWidth={1.5} />
        <span className="font-mono uppercase tracking-wider text-muted-foreground" style={{ fontSize: 9 * size }}>Steer</span>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onReset}
          title="Reset position & size"
          className="ml-auto flex items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-primary"
          style={{ width: b * 0.6, height: b * 0.6 }}
        >
          <RotateCcw style={{ width: ic * 0.7, height: ic * 0.7 }} strokeWidth={1.5} />
        </button>
      </div>

      <div className="flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
        <span className="font-mono uppercase tracking-wider text-muted-foreground" style={{ fontSize: 8 * size }}>Size</span>
        <input
          type="range" min="0.6" max="1.6" step="0.1" value={size}
          onChange={(e) => onSizeChange?.(Number(e.target.value))}
          className="w-full accent-primary"
          style={{ height: 14 * size }}
        />
      </div>

      <div className="flex flex-col items-center" style={{ gap: g }}>
        <button {...hold("v", 1)} className={btnBase} style={{ width: b, height: b }} aria-label={`${vLabel} up`}>
          <ChevronUp style={{ width: ic, height: ic }} strokeWidth={2.5} />
        </button>
        <div className="flex items-center" style={{ gap: g }}>
          <button {...hold("h", -1)} className={btnBase} style={{ width: b, height: b }} aria-label={`${hLabel} left`}>
            <ChevronLeft style={{ width: ic, height: ic }} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col items-center" style={{ width: 64 * size }}>
            <span className="font-mono font-semibold text-primary" style={{ fontSize: 11 * size }}>{vVal}</span>
            <span className="font-mono uppercase tracking-wider text-muted-foreground" style={{ fontSize: 8 * size }}>{vLabel}</span>
          </div>
          <button {...hold("h", 1)} className={btnBase} style={{ width: b, height: b }} aria-label={`${hLabel} right`}>
            <ChevronRight style={{ width: ic, height: ic }} strokeWidth={2.5} />
          </button>
        </div>
        <button {...hold("v", -1)} className={btnBase} style={{ width: b, height: b }} aria-label={`${vLabel} down`}>
          <ChevronDown style={{ width: ic, height: ic }} strokeWidth={2.5} />
        </button>
        <div className="flex w-full items-center justify-between font-mono text-muted-foreground" style={{ fontSize: 9 * size }}>
          <span>{hLabel}</span>
          <span className="text-primary">{hVal}</span>
        </div>
      </div>
    </div>
  );
}