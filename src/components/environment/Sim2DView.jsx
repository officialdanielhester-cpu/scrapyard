import React from "react";
import { drawGlyph, COLORS } from "@/components/workshop/part-visuals";

// 2D schematic sim view: shows the exact placed build plus a live trajectory marker.
const VBW = 600, VBH = 480, GROUND = VBH - 34, START_X = 90;

const tintColors = (color) =>
  color ? { ...COLORS, body: color, bodyHi: color, aero: color, engine: color, gear: color, struct: color } : COLORS;

export default function Sim2DView({ build, metrics, vehicleType }) {
  const dist = metrics?.distance || 0;
  const alt = metrics?.altitude || 0;
  const mx = START_X + Math.min(VBW - START_X - 30, dist * 2.4);
  const my = GROUND - Math.min(GROUND - 50, alt * 1.3);

  return (
    <div className="relative h-full w-full rounded-2xl border border-border/50 bg-gradient-to-b from-background to-muted/30">
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">2D Schematic</span>
      </div>
      <svg viewBox={`0 0 ${VBW} ${VBH}`} className="h-full w-full">
        <line x1={0} y1={GROUND} x2={VBW} y2={GROUND} stroke="hsl(var(--border))" strokeWidth={1.5} />
        <line x1={START_X} y1={GROUND - 40} x2={START_X} y2={GROUND} stroke="hsl(var(--primary))" strokeOpacity={0.5} strokeWidth={1} strokeDasharray="3 3" />
        <text x={START_X - 6} y={GROUND + 22} fill="hsl(var(--muted-foreground))" fontSize={10} className="font-mono">start</text>

        {/* placed build (exact), shown at the start marker */}
        <g transform={`translate(${START_X} ${GROUND - 4})`}>
          {(build || []).map((inst) => (
            <g
              key={inst.iid}
              transform={`translate(${(inst.x - 300) * 0.45} ${-(inst.y - 240) * 0.45 - 24}) scale(${(inst.scale || 1) * 0.45}) translate(-24 -24)`}
            >
              {drawGlyph(inst.type, tintColors(inst.color))}
            </g>
          ))}
        </g>

        {/* trajectory marker */}
        <line x1={START_X} y1={GROUND} x2={mx} y2={my} stroke="hsl(var(--primary))" strokeOpacity={0.4} strokeWidth={1.5} strokeDasharray="4 3" />
        <circle cx={mx} cy={my} r={7} fill="hsl(var(--primary))" />
        <circle cx={mx} cy={my} r={12} fill="none" stroke="hsl(var(--primary))" strokeOpacity={0.3} strokeWidth={1.5} />

        <text x={16} y={28} fill="hsl(var(--muted-foreground))" fontSize={11} className="font-mono">
          2D · alt {alt.toFixed(0)} m · dist {dist.toFixed(0)} m
        </text>
      </svg>
    </div>
  );
}