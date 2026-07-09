import React, { useRef, useEffect, useState } from "react";
import { hexToHsv, hsvToHex } from "@/components/grid/brushes";

const PALETTE = [
  "#000000", "#ffffff", "#94a3b8", "#6b7280",
  "#ef4444", "#f97316", "#f59e0b", "#eab308",
  "#84cc16", "#22c55e", "#10b981", "#14b8a6",
  "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6",
  "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
];

export default function ColorPicker({ color, onChange, recent, onPushRecent }) {
  const [hue, setHue] = useState(hexToHsv(color).h);
  const svRef = useRef(null);
  const hueRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    setHue(hexToHsv(color).h);
  }, [color]);

  const updateSV = (e) => {
    const el = svRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let sx = (e.clientX - r.left) / r.width;
    let sy = (e.clientY - r.top) / r.height;
    sx = Math.max(0, Math.min(1, sx));
    sy = Math.max(0, Math.min(1, sy));
    onChange(hsvToHex(hue, sx, 1 - sy));
  };

  const updateHue = (e) => {
    const el = hueRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let hh = ((e.clientX - r.left) / r.width) * 360;
    hh = Math.max(0, Math.min(360, hh));
    setHue(hh);
    const { s, v } = hexToHsv(color);
    onChange(hsvToHex(hh, s, v));
  };

  const onMove = (e) => {
    if (drag.current === "sv") updateSV(e);
    else if (drag.current === "hue") updateHue(e);
  };
  const onUp = () => {
    if (drag.current) onPushRecent(color);
    drag.current = null;
  };

  const { s, v } = hexToHsv(color);
  const svBg = {
    background:
      "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(" +
      hue +
      ",100%,50%))",
  };

  return (
    <div className="space-y-2">
      <div
        ref={svRef}
        onPointerDown={(e) => { drag.current = "sv"; updateSV(e); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="relative h-28 w-full cursor-crosshair touch-none rounded-lg"
        style={svBg}
      >
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
        />
      </div>

      <div
        ref={hueRef}
        onPointerDown={(e) => { drag.current = "hue"; updateHue(e); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="relative h-3 w-full cursor-pointer touch-none rounded-full"
        style={{ background: "linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}
      >
        <div
          className="pointer-events-none absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-white shadow"
          style={{ left: `${(hue / 360) * 100}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="h-8 w-8 shrink-0 rounded-md border border-border/60" style={{ background: color }} />
        <input
          value={color}
          onChange={(e) => {
            let val = e.target.value;
            if (!val.startsWith("#")) val = "#" + val.replace(/#/g, "");
            if (/^#[0-9a-fA-F]{0,6}$/.test(val)) onChange(val.toLowerCase());
          }}
          onBlur={() => {
            if (!/^#[0-9a-fA-F]{6}$/.test(color)) onChange("#000000");
            else onPushRecent(color);
          }}
          className="w-full rounded-md border border-border/60 bg-transparent px-2 py-1.5 font-mono text-[11px] uppercase text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-10 gap-1">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => { onChange(c); onPushRecent(c); }}
            className="h-4 w-full rounded-sm border border-border/40 transition-transform hover:scale-110"
            style={{ background: c }}
            aria-label={c}
          />
        ))}
      </div>

      <div className="grid grid-cols-10 gap-1">
        {recent.map((c) => (
          <button
            key={c}
            onClick={() => { onChange(c); onPushRecent(c); }}
            className="h-4 w-full rounded-sm border border-border/40 transition-transform hover:scale-110"
            style={{ background: c }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );
}