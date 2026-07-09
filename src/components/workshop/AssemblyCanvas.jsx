import React, { useMemo, useState } from "react";
import { Boxes, Square, Box as BoxIcon, Rocket } from "lucide-react";
import { VEHICLES } from "@/components/environment/presets";
import { PARTS_BY_ID } from "@/components/workshop/parts-catalog";
import {
  layoutAssembly,
  drawShape,
  drawBooster,
  COLORS,
  CANVAS_W,
  CX,
  BODY_W,
} from "@/components/workshop/part-visuals";
import AssemblyCanvas3D from "@/components/workshop/AssemblyCanvas3D";

// Visual assembly bay: stacks applied parts into a vehicle silhouette.
// 2D (SVG) / 3D (three.js) toggle. Drag parts from the catalog to add;
// click a rendered part to remove one instance.
export default function AssemblyCanvas({ applied, vehicleType, onRemoveInstance, onAdd, onImport }) {
  const [mode, setMode] = useState("2d");
  const [hover, setHover] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const layout = useMemo(() => layoutAssembly(applied), [applied]);
  const vehicleLabel = VEHICLES[vehicleType]?.label || vehicleType;

  const Toggle = (
    <div className="flex rounded-full border border-border/60 p-0.5">
      <button
        onClick={() => setMode("2d")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
          mode === "2d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Square className="h-3 w-3" strokeWidth={2} /> 2D
      </button>
      <button
        onClick={() => setMode("3d")}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors ${
          mode === "3d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <BoxIcon className="h-3 w-3" strokeWidth={2} /> 3D
      </button>
    </div>
  );

  const ImportBtn = onImport && (
    <button
      onClick={onImport}
      className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
    >
      <Rocket className="h-3 w-3" strokeWidth={2} /> Import to Playground
    </button>
  );

  const dropHandlers = {
    onDragOver: (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; if (!dragOver) setDragOver(true); },
    onDragLeave: (e) => { if (e.currentTarget === e.target) setDragOver(false); },
    onDrop: (e) => {
      e.preventDefault();
      setDragOver(false);
      const id = e.dataTransfer.getData("text/part");
      if (id && onAdd) onAdd(id);
    },
  };

  const headerRight = (
    <div className="flex items-center gap-3">
      <span className="hidden font-mono text-[9px] uppercase tracking-wider text-muted-foreground/60 sm:inline">
        {mode === "2d" ? "click a part to remove" : "drag to orbit · click to remove"}
      </span>
      {ImportBtn}
      {Toggle}
    </div>
  );

  if (!layout.hasContent) {
    return (
      <div
        {...dropHandlers}
        className={`overflow-hidden rounded-2xl border bg-gradient-to-b from-background to-muted/30 transition-colors ${
          dragOver ? "border-primary ring-2 ring-primary/40" : "border-border/50"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Assembly Bay</h3>
          {headerRight}
        </div>
        <div className="flex h-[380px] flex-col items-center justify-center text-center">
          <Boxes className="h-8 w-8 text-muted-foreground/40" strokeWidth={1} />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Empty assembly bay</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            {dragOver ? "Drop to add part" : `Drag parts here, or add below to build your ${vehicleLabel.toLowerCase()}`}
          </p>
        </div>
      </div>
    );
  }

  const boosterLeftX = CX - BODY_W / 2 - 14;
  const boosterRightX = CX + BODY_W / 2 + 14;
  const boosterTop = layout.bodyTop + 6;
  const boosterBottom = Math.max(layout.bodyBottom + 10, layout.bodyTop + 120);
  const hasBoosters = layout.boosters.length > 0;

  const handlers = (id, key) => ({
    className: "cursor-pointer transition-opacity",
    onMouseEnter: () => setHover(key),
    onMouseLeave: () => setHover(null),
    onClick: () => onRemoveInstance?.(id),
  });

  return (
    <div
      {...dropHandlers}
      className={`overflow-hidden rounded-2xl border bg-gradient-to-b from-background to-muted/30 transition-colors ${
        dragOver ? "border-primary ring-2 ring-primary/40" : "border-border/50"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Assembly Bay</h3>
        {headerRight}
      </div>

      {mode === "3d" ? (
        <div className="h-[480px]">
          <AssemblyCanvas3D applied={applied} onRemoveInstance={onRemoveInstance} />
        </div>
      ) : (
        <div className="max-h-[480px] overflow-auto">
          <div className="flex justify-center px-4 py-6">
            <svg width={CANVAS_W} height={layout.canvasH} viewBox={`0 0 ${CANVAS_W} ${layout.canvasH}`}>
              <line
                x1={12}
                y1={layout.canvasH - 18}
                x2={CANVAS_W - 12}
                y2={layout.canvasH - 18}
                stroke="hsl(var(--border))"
                strokeWidth={1}
                strokeDasharray="2 3"
              />

              {hasBoosters && (
                <>
                  <g {...handlers("solid_booster", "booster-L")} opacity={hover === "booster-L" ? 0.7 : 1}>
                    <title>Solid Booster — click to remove</title>
                    {drawBooster(boosterLeftX, boosterTop, boosterBottom, COLORS)}
                  </g>
                  <g {...handlers("solid_booster", "booster-R")} opacity={hover === "booster-R" ? 0.7 : 1}>
                    <title>Solid Booster — click to remove</title>
                    {drawBooster(boosterRightX, boosterTop, boosterBottom, COLORS)}
                  </g>
                </>
              )}

              {layout.side.map((s, i) => (
                <g key={`side-${i}`} {...handlers(s.id, `side-${i}`)} opacity={hover === `side-${i}` ? 0.7 : 1}>
                  <title>{`${PARTS_BY_ID[s.id]?.label || s.id} — click to remove`}</title>
                  {drawShape(s.id, { cx: s.cx, y: s.y, w: s.w, colors: COLORS })}
                </g>
              ))}

              {layout.placed.map((p, i) => {
                const key = `p-${i}`;
                const isHover = hover === key;
                return (
                  <g key={key} {...handlers(p.id, key)} opacity={isHover ? 0.7 : 1}>
                    <title>{`${PARTS_BY_ID[p.id]?.label || p.id} — click to remove`}</title>
                    {drawShape(p.id, { cx: p.cx, y: p.y, w: p.w, colors: COLORS })}
                    {isHover && (
                      <rect
                        x={p.cx - p.w / 2 - 4}
                        y={p.y - 2}
                        width={p.w + 8}
                        height={p.h + 4}
                        rx={6}
                        fill="none"
                        stroke="hsl(var(--destructive))"
                        strokeWidth={1.5}
                        strokeDasharray="3 2"
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}