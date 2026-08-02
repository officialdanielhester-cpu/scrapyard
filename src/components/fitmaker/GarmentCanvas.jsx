import React, { forwardRef, useMemo, useRef, useState } from "react";
import { MATERIAL_MAP, FINISHES } from "@/components/fitmaker/materials";

// Build the SVG transform string for a group based on matching measurements.
function groupTransform(tpl, group, measurements) {
  const parts = [];
  Object.entries(tpl.measurements).forEach(([key, m]) => {
    if (m.group !== group.id && m.group !== group.role) return;
    const v = measurements[key];
    if (v == null) return;
    const ratio = v / m.default;
    if (!isFinite(ratio) || ratio === 1) return;
    const [px, py] = m.pivot;
    parts.push(`translate(${px} ${py}) scale(${m.axis === "x" ? ratio : 1} ${m.axis === "y" ? ratio : 1}) translate(${-px} ${-py})`);
  });
  return parts.join(" ");
}

// Convert an array of [x,y] points into an SVG path string (a single point becomes a dot).
function pathFromPoints(pts) {
  if (!pts || !pts.length) return "";
  if (pts.length === 1) {
    const [x, y] = pts[0];
    return `M ${x} ${y} L ${x} ${y}`;
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) d += ` L ${pts[i][0]} ${pts[i][1]}`;
  return d;
}

const GUIDE = "#3b82f6";

const GarmentCanvas = forwardRef(function GarmentCanvas({
  template, state, rotate = 0, zoom = 1, showGuides = false, className = "",
  paint = false, paintBrush = "pen", paintColor = "#3b82f6", paintSize = 8, paintOpacity = 1, onPaintStroke,
}, ref) {
  const mat = MATERIAL_MAP[state.material] || MATERIAL_MAP.cotton;
  const matProps = state.materialProps || {};
  const texture = matProps.texture ?? mat.texture;
  const reflectivity = matProps.reflectivity ?? mat.reflectivity;
  const roughness = matProps.roughness ?? mat.roughness;
  const transparency = matProps.transparency ?? mat.transparency;
  const finish = FINISHES.find((f) => f.id === (state.finish || "matte")) || FINISHES[0];
  const sheen = finish.sheen * (0.4 + reflectivity);

  const filterId = useMemo(() => `fabric-${template.id}-${Math.random().toString(36).slice(2, 7)}`, [template.id]);
  const fillId = useMemo(() => `fill-${template.id}-${Math.random().toString(36).slice(2, 7)}`, [template.id]);
  const sheenId = useMemo(() => `sheen-${template.id}-${Math.random().toString(36).slice(2, 7)}`, [template.id]);
  const maskId = useMemo(() => `paint-mask-${template.id}-${Math.random().toString(36).slice(2, 7)}`, [template.id]);

  const measurements = state.measurements || {};
  const enabled = state.features || [];
  const bodyFill = state.patternUrl ? `url(#${fillId})` : state.gradient && state.color2 ? `url(#${fillId})` : state.color;
  const opacity = 1 - (transparency || 0) * 0.7;

  const featurePaths = (template.features || []).filter((f) => enabled.includes(f.id)).flatMap((f) => f.paths);

  const [vbx, vby, vbw, vbh] = useMemo(() => template.viewBox.split(/\s+/).map(Number), [template.viewBox]);
  const strokes = state.strokes || [];

  // Live (in-progress) paint stroke.
  const svgRef = useRef(null);
  const drawingRef = useRef(false);
  const liveRef = useRef(null);
  const [live, setLive] = useState(null);

  const setSvgRef = (el) => {
    svgRef.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };

  const toSvg = (e) => {
    const svg = svgRef.current;
    if (!svg || !svg.getScreenCTM) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const p = pt.matrixTransform(m.inverse());
    return [p.x, p.y];
  };

  const onDown = (e) => {
    if (!paint) return;
    e.stopPropagation();
    const p = toSvg(e);
    if (!p) return;
    drawingRef.current = true;
    const isEraser = paintBrush === "eraser";
    const s = {
      tool: isEraser ? "eraser" : paintBrush,
      color: paintColor,
      width: paintSize,
      opacity: isEraser ? 1 : paintOpacity,
      points: [p],
    };
    liveRef.current = s;
    setLive(s);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };

  const onMove = (e) => {
    if (!drawingRef.current) return;
    const p = toSvg(e);
    if (!p) return;
    const s = liveRef.current;
    if (!s) return;
    const last = s.points[s.points.length - 1];
    if (last && Math.hypot(p[0] - last[0], p[1] - last[1]) < 0.6) return;
    s.points.push(p);
    setLive({ ...s, points: s.points.slice() });
  };

  const finishStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const s = liveRef.current;
    liveRef.current = null;
    setLive(null);
    if (s && s.points.length) onPaintStroke?.(s);
  };

  const allStrokes = live ? [...strokes, live] : strokes;

  return (
    <svg
      ref={setSvgRef}
      viewBox={template.viewBox}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={finishStroke}
      onPointerCancel={finishStroke}
      style={{
        transform: `perspective(900px) rotateY(${rotate}deg) scale(${zoom})`,
        transition: "transform 0.25s ease",
        transformOrigin: "center",
        cursor: paint ? "crosshair" : "default",
        touchAction: paint ? "none" : "auto",
      }}
    >
      <defs>
        {/* Fabric texture filter */}
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency={0.02 + texture * 0.05} numOctaves={2} seed={3} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={texture * 10} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation={roughness * 0.4} />
        </filter>
        {/* Fill (solid, gradient, or pattern) */}
        {state.patternUrl ? (
          <pattern id={fillId} patternUnits="userSpaceOnUse" width="60" height="60">
            <image href={state.patternUrl} x="0" y="0" width="60" height="60" preserveAspectRatio="xMidYMid slice" />
          </pattern>
        ) : state.gradient && state.color2 ? (
          <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={state.color} />
            <stop offset="100%" stopColor={state.color2} />
          </linearGradient>
        ) : null}
        {/* Sheen overlay for glossy / metallic finishes */}
        <radialGradient id={sheenId} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={sheen * 0.9} />
          <stop offset="40%" stopColor="#ffffff" stopOpacity={sheen * 0.15} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Paint mask: white reveals paint, black (eraser / default) hides it */}
        <mask id={maskId}>
          <rect x={vbx} y={vby} width={vbw} height={vbh} fill="black" />
          {allStrokes.map((s, i) => (
            <path
              key={`m-${i}`}
              d={pathFromPoints(s.points)}
              stroke={s.tool === "eraser" ? "black" : "white"}
              strokeWidth={s.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={s.opacity}
            />
          ))}
        </mask>
      </defs>

      {/* Soft drop shadow */}
      <ellipse cx="150" cy="345" rx="110" ry="12" fill="#00000022" />

      {/* Garment groups */}
      <g filter={`url(#${filterId})`} opacity={opacity}>
        {template.groups.map((g) => (
          <path
            key={g.id}
            d={g.d}
            fill={g.role === "detail" ? "none" : bodyFill}
            stroke={g.role === "detail" ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.25)"}
            strokeWidth={g.role === "detail" ? 1.4 : 1.2}
            strokeLinejoin="round"
            transform={groupTransform(template, g, measurements)}
          />
        ))}
        {/* Sheen overlay clipped to body silhouette */}
        {sheen > 0.05 && template.groups.filter((g) => g.role === "body" || g.role === "collar").map((g) => (
          <path key={`sheen-${g.id}`} d={g.d} fill={`url(#${sheenId})`} transform={groupTransform(template, g, measurements)} style={{ mixBlendMode: "screen" }} />
        ))}
        {/* Feature graphics */}
        {featurePaths.map((p, i) => (
          <path key={`feat-${i}`} d={p.d} fill={p.fill || (p.role === "detail" ? "none" : bodyFill)} stroke="rgba(0,0,0,0.45)" strokeWidth={p.fill ? 0 : 1.4} strokeLinecap="round" />
        ))}
      </g>

      {/* Paint layer (masked: eraser hides prior paint) */}
      <g mask={`url(#${maskId})`} style={{ pointerEvents: "none" }}>
        {allStrokes.map((s, i) => (
          s.tool !== "eraser" ? (
            <path
              key={`p-${i}`}
              d={pathFromPoints(s.points)}
              stroke={s.color}
              strokeWidth={s.width}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={s.opacity}
              style={s.tool === "highlighter" ? { mixBlendMode: "multiply" } : undefined}
            />
          ) : null
        ))}
      </g>

      {/* Measurement guides */}
      {showGuides && Object.entries(template.measurements).map(([key, m]) => {
        const [px, py] = m.pivot;
        return (
          <g key={`guide-${key}`} stroke={GUIDE} strokeWidth="1" strokeDasharray="3 3" opacity="0.8">
            {m.axis === "y" ? <line x1={px} y1={py - 20} x2={px} y2={py + 60} /> : <line x1={px - 30} y1={py} x2={px + 30} y2={py} />}
            <text x={px + 6} y={py - 6} fontSize="9" fill={GUIDE} stroke="none">{m.label}</text>
          </g>
        );
      })}
    </svg>
  );
});

export default GarmentCanvas;