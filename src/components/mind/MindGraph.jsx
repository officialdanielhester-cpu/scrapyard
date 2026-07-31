import React, { useMemo, useState, useRef, useCallback } from "react";
import { extractLinks } from "@/components/mind/markdown-utils";

// Lightweight interactive knowledge graph: notes arranged on a circle, linked by [[...]].
export default function MindGraph({ notes, onOpen }) {
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef(null);
  const svgRef = useRef(null);

  const positions = useMemo(() => {
    const R = Math.max(180, 120 + notes.length * 14);
    return notes.map((n, i) => {
      const a = (i / Math.max(1, notes.length)) * 2 * Math.PI;
      return { id: n.id, x: Math.cos(a) * R, y: Math.sin(a) * R, title: n.title, icon: n.icon || "📝" };
    });
  }, [notes]);

  const edges = useMemo(() => {
    const idMap = new Map(notes.map((n) => [n.id, n]));
    const titleMap = new Map();
    notes.forEach((n) => titleMap.set(n.title.toLowerCase(), n.id));
    const out = [];
    notes.forEach((n) => {
      const links = extractLinks(n.content);
      links.forEach((l) => {
        const targetId = titleMap.get(l.toLowerCase()) || (idMap.get(l) ? l : null);
        if (targetId && targetId !== n.id) out.push({ from: n.id, to: targetId });
      });
    });
    return out;
  }, [notes]);

  const posMap = new Map(positions.map((p) => [p.id, p]));

  const onPointerDown = (e) => {
    dragRef.current = { sx: e.clientX, sy: e.clientY, tx: transform.x, ty: transform.y };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };
  const onMove = useCallback((e) => {
    const d = dragRef.current; if (!d) return;
    setTransform((t) => ({ ...t, x: d.tx + (e.clientX - d.sx), y: d.ty + (e.clientY - d.sy) }));
  }, []);
  const onUp = useCallback(() => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }, []);

  const onWheel = (e) => {
    e.preventDefault();
    setTransform((t) => ({ ...t, scale: Math.max(0.3, Math.min(2.4, t.scale * (e.deltaY > 0 ? 0.92 : 1.08))) }));
  };

  const W = 600, H = 480;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/40 px-6 py-3">
        <div>
          <h1 className="font-heading text-lg font-bold">Knowledge Graph</h1>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{notes.length} notes · {edges.length} links · drag to pan · scroll to zoom</p>
        </div>
      </div>
      <div className="relative flex-1 overflow-hidden bg-[radial-gradient(hsl(var(--muted-foreground)/0.12)_1px,transparent_1px)] [background-size:24px_24px]"
        onPointerDown={onPointerDown} onWheel={onWheel} style={{ cursor: "grab" }}>
        <svg ref={svgRef} viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} className="h-full w-full">
          <g transform={`translate(${transform.x / 2} ${transform.y / 2}) scale(${transform.scale})`}>
            {edges.map((e, i) => {
              const a = posMap.get(e.from), b = posMap.get(e.to);
              if (!a || !b) return null;
              return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--primary)/0.4)" strokeWidth={1.4} />;
            })}
            {positions.map((p) => (
              <g key={p.id} className="cursor-pointer" onClick={() => onOpen(p.id)}>
                <circle cx={p.x} cy={p.y} r={20} fill="hsl(var(--card))" stroke="hsl(var(--primary))" strokeWidth={2} />
                <text x={p.x} y={p.y + 6} textAnchor="middle" fontSize={16}>{p.icon}</text>
                <text x={p.x} y={p.y + 34} textAnchor="middle" fontSize={9} fill="hsl(var(--foreground))" className="max-w-[80px]">
                  {(p.title || "").slice(0, 18)}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}