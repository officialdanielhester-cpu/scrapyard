import React from "react";
import { Boxes } from "lucide-react";

function strokePath(stroke) {
  const pts = stroke.points || [];
  if (!pts.length) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i][0]} ${pts[i][1]}`;
  }
  if (pts.length === 1) {
    d += ` L ${pts[0][0] + 0.001} ${pts[0][1]}`;
  }
  return d;
}

function strokeProps(stroke) {
  const base = { stroke: stroke.color, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  if (stroke.tool === "pen") return { ...base, strokeWidth: 0.008, opacity: 1 };
  if (stroke.tool === "marker") return { ...base, strokeWidth: 0.014, opacity: 0.7 };
  return { ...base, strokeWidth: 0.03, opacity: 0.3, style: { mixBlendMode: "multiply" } };
}

export default function Grid2D({ models, onOpen }) {
  if (!models || models.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 text-center">
        <Boxes className="h-8 w-8 text-muted-foreground/50" strokeWidth={1} />
        <p className="mt-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">The grid is empty</p>
        <p className="mt-1 text-sm text-muted-foreground/70">Tell Jabber what to make below</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {models.map((m) => (
        <button
          key={m.id}
          onClick={() => onOpen(m)}
          className="group relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-card text-left transition-transform duration-300 hover:scale-[1.02]"
        >
          {m.image_url ? (
            <img
              src={m.image_url}
              alt={m.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `radial-gradient(circle at 50% 42%, ${m.color || "#3B82F6"}40, transparent 72%)` }}
            >
              <span
                className="h-14 w-14 rotate-12 rounded-lg shadow-lg transition-transform duration-500 group-hover:rotate-45"
                style={{ background: m.color || "#3B82F6" }}
              />
            </div>
          )}
          {(m.markup || []).length > 0 && (
            <svg
              viewBox="0 0 1 1"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full pointer-events-none"
            >
              {(m.markup || []).map((s, i) => (
                <path key={i} d={strokePath(s)} {...strokeProps(s)} />
              ))}
            </svg>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
            <p className="truncate text-xs font-medium text-white">{m.name}</p>
            <span className="font-mono text-[9px] uppercase tracking-wider text-white/60">
              {m.mode === "2d" ? "2D" : (m.geometry || "3d")}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}