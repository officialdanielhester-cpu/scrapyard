import React, { useRef, useState } from "react";
import { Trash2, Palette } from "lucide-react";
import { drawGlyph, COLORS } from "@/components/workshop/part-visuals";

// Free-form 2D assembly bay: drop parts anywhere, then grab/move/scale/recolor them.
const VBW = 600, VBH = 480;

const tintColors = (color) => {
  if (!color) return COLORS;
  return { ...COLORS, body: color, bodyHi: color, aero: color, engine: color, gear: color, struct: color };
};

const newIid = () => `i-${Math.random().toString(36).slice(2, 9)}`;

export default function FreeAssemblyCanvas({ instances, setInstances }) {
  const svgRef = useRef(null);
  const [selected, setSelected] = useState(null);
  const drag = useRef(null);

  const toSvg = (clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: VBW / 2, y: VBH / 2 };
    const pt = svg.createSVGPoint();
    pt.x = clientX; pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: VBW / 2, y: VBH / 2 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  };

  const onDrop = (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/part");
    if (!id) return;
    const { x, y } = toSvg(e.clientX, e.clientY);
    const inst = { iid: newIid(), type: id, x: Math.round(x), y: Math.round(y), scale: 1, color: "" };
    setInstances((prev) => [...prev, inst]);
    setSelected(inst.iid);
  };

  const startMove = (e, inst) => {
    e.stopPropagation();
    setSelected(inst.iid);
    const start = toSvg(e.clientX, e.clientY);
    drag.current = { iid: inst.iid, dx: start.x - inst.x, dy: start.y - inst.y };
    const onMove = (ev) => {
      if (!drag.current) return;
      const d = drag.current;
      const cur = toSvg(ev.clientX, ev.clientY);
      const nx = Math.max(20, Math.min(VBW - 20, cur.x - d.dx));
      const ny = Math.max(20, Math.min(VBH - 20, cur.y - d.dy));
      setInstances((prev) =>
        prev.map((p) => (p.iid === d.iid ? { ...p, x: Math.round(nx), y: Math.round(ny) } : p))
      );
    };
    const onUp = () => {
      drag.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const sel = instances.find((i) => i.iid === selected);
  const updateSel = (patch) =>
    setInstances((prev) => prev.map((p) => (p.iid === selected ? { ...p, ...patch } : p)));
  const deleteSel = () => {
    setInstances((prev) => prev.filter((p) => p.iid !== selected));
    setSelected(null);
  };

  return (
    <div className="relative">
      {sel && (
        <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-background/90 px-3 py-2 backdrop-blur">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {sel.type.replace(/_/g, " ")}
          </span>
          <label className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="color"
              value={sel.color || "#3b82f6"}
              onChange={(e) => updateSel({ color: e.target.value })}
              className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Size</span>
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={sel.scale}
              onChange={(e) => updateSel({ scale: Number(e.target.value) })}
              className="w-20 accent-primary"
            />
          </label>
          <button
            onClick={deleteSel}
            className="flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 font-mono text-[10px] uppercase text-destructive hover:bg-destructive/5"
          >
            <Trash2 className="h-3 w-3" /> Del
          </button>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VBW} ${VBH}`}
        className="h-[460px] w-full touch-none"
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
        onPointerDown={(e) => {
          if (e.target === svgRef.current || e.target.tagName === "rect") setSelected(null);
        }}
      >
        <rect x={0} y={0} width={VBW} height={VBH} fill="hsl(var(--muted) / 0.25)" />
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`gx${i}`} x1={i * 50} y1={0} x2={i * 50} y2={VBH} stroke="hsl(var(--border))" strokeOpacity={0.25} strokeWidth={0.5} />
        ))}
        {Array.from({ length: 11 }).map((_, i) => (
          <line key={`gy${i}`} x1={0} y1={i * 50} x2={VBW} y2={i * 50} stroke="hsl(var(--border))" strokeOpacity={0.25} strokeWidth={0.5} />
        ))}
        <line x1={0} y1={VBH - 20} x2={VBW} y2={VBH - 20} stroke="hsl(var(--border))" strokeWidth={1} strokeDasharray="3 3" />

        {instances.length === 0 && (
          <text x={VBW / 2} y={VBH / 2} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={13} className="font-mono">
            Drag parts here to assemble your vehicle
          </text>
        )}

        {instances.map((inst) => {
          const isSel = inst.iid === selected;
          const s = inst.scale || 1;
          return (
            <g
              key={inst.iid}
              transform={`translate(${inst.x} ${inst.y}) scale(${s}) translate(-24 -24)`}
              onPointerDown={(e) => startMove(e, inst)}
              className="cursor-move"
            >
              {drawGlyph(inst.type, tintColors(inst.color))}
              {isSel && (
                <rect
                  x={-5}
                  y={-5}
                  width={58}
                  height={58}
                  rx={7}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2 / s}
                  strokeDasharray="4 3"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}