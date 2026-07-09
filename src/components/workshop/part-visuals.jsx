import React from "react";

// Shared visual system for the Workshop assembly bay and parts catalog.
// Geometry is illustrative only — physics lives in parts-catalog.js.

export const BODY_W = 60;
export const CANVAS_W = 220;
export const CX = 110;

export const COLORS = {
  body: "hsl(var(--primary))",
  bodyHi: "hsl(var(--primary) / 0.45)",
  struct: "hsl(var(--muted-foreground) / 0.85)",
  engine: "hsl(var(--muted-foreground))",
  aero: "hsl(var(--chart-3))",
  gear: "hsl(var(--muted-foreground))",
  stroke: "hsl(var(--primary-foreground) / 0.35)",
};

const pts = (arr) => arr.map((p) => `${p[0]},${p[1]}`).join(" ");

export const PART_SHAPES = {
  nose_cone: { slot: "apex", h: 46 },
  fuel_tank: { slot: "body", h: 64, order: 3 },
  payload: { slot: "body", h: 42, order: 1 },
  battery: { slot: "body", h: 30, order: 2 },
  heat_shield: { slot: "body", h: 18, order: 4 },
  liquid_engine: { slot: "base", h: 44 },
  solid_booster: { slot: "booster", h: 0 },
  jet_engine: { slot: "base", h: 36 },
  turboshaft: { slot: "base", h: 40 },
  fin: { slot: "side", h: 0 },
  wing: { slot: "side", h: 0 },
  canard: { slot: "side", h: 0 },
  rotor_blade: { slot: "top", h: 14 },
  wheel: { slot: "gear", h: 18 },
};

const BODY_ORDER = { payload: 1, battery: 2, fuel_tank: 3, heat_shield: 4 };

// Expand applied parts (with qty) into a vertically stacked layout.
export function layoutAssembly(applied) {
  const inst = [];
  (applied || []).forEach((ap) => {
    const meta = PART_SHAPES[ap.type];
    if (!meta) return;
    const q = Math.max(1, ap.qty || 1);
    for (let i = 0; i < q; i++) inst.push({ id: ap.type });
  });

  const apex = inst.find((p) => PART_SHAPES[p.id].slot === "apex");
  const rotor = inst.find((p) => PART_SHAPES[p.id].slot === "top");
  const body = inst
    .filter((p) => PART_SHAPES[p.id].slot === "body")
    .sort((a, b) => (BODY_ORDER[a.id] || 99) - (BODY_ORDER[b.id] || 99));
  const base = inst.filter((p) => PART_SHAPES[p.id].slot === "base");
  const boosters = inst.filter((p) => PART_SHAPES[p.id].slot === "booster");
  const fins = inst.filter((p) => p.id === "fin");
  const wings = inst.filter((p) => p.id === "wing");
  const canards = inst.filter((p) => p.id === "canard");
  const wheels = inst.filter((p) => p.id === "wheel");

  const PAD = 28;
  let y = PAD;
  const placed = [];

  if (rotor) {
    placed.push({ id: rotor.id, cx: CX, y, w: BODY_W, h: PART_SHAPES[rotor.id].h, role: "top" });
    y += PART_SHAPES[rotor.id].h;
  }
  if (apex) {
    placed.push({ id: apex.id, cx: CX, y, w: BODY_W, h: PART_SHAPES[apex.id].h, role: "apex" });
    y += PART_SHAPES[apex.id].h;
  }
  const bodyTop = y;
  body.forEach((p) => {
    placed.push({ id: p.id, cx: CX, y, w: BODY_W, h: PART_SHAPES[p.id].h, role: "body" });
    y += PART_SHAPES[p.id].h;
  });
  const bodyBottom = y;
  base.forEach((p) => {
    placed.push({ id: p.id, cx: CX, y, w: BODY_W, h: PART_SHAPES[p.id].h, role: "base" });
    y += PART_SHAPES[p.id].h;
  });
  if (wheels.length) {
    placed.push({ id: "wheel", cx: CX, y, w: BODY_W, h: PART_SHAPES.wheel.h, role: "gear" });
    y += PART_SHAPES.wheel.h;
  }
  const totalH = y;

  const side = [];
  if (fins.length) side.push({ id: "fin", cx: CX, y: bodyBottom - 2, w: BODY_W, role: "fin" });
  if (wings.length)
    side.push({ id: "wing", cx: CX, y: bodyTop + Math.max(8, (bodyBottom - bodyTop) * 0.45), w: BODY_W, role: "wing" });
  if (canards.length) side.push({ id: "canard", cx: CX, y: bodyTop + 8, w: BODY_W, role: "canard" });

  return {
    placed,
    side,
    boosters,
    bodyTop,
    bodyBottom,
    totalH,
    canvasH: Math.max(380, totalH + PAD),
    hasContent: placed.length > 0 || side.length > 0 || boosters.length > 0,
  };
}

// Draw a single part instance at center cx, top y, body width w.
export function drawShape(id, { cx, y, w, colors = COLORS }) {
  const c = colors;
  const L = cx - w / 2;
  const R = cx + w / 2;
  switch (id) {
    case "nose_cone":
      return (
        <g>
          <polygon points={pts([[L, y + 46], [R, y + 46], [cx, y]])} fill={c.body} />
          <line x1={cx} y1={y + 8} x2={cx} y2={y + 42} stroke={c.stroke} strokeWidth={1.2} />
        </g>
      );
    case "fuel_tank":
      return (
        <g>
          <rect x={L} y={y} width={w} height={64} rx={6} fill={c.body} />
          <rect x={L} y={y} width={Math.max(8, w * 0.2)} height={64} rx={6} fill={c.bodyHi} />
          <line x1={L} y1={y + 21} x2={R} y2={y + 21} stroke={c.stroke} strokeWidth={1} />
          <line x1={L} y1={y + 42} x2={R} y2={y + 42} stroke={c.stroke} strokeWidth={1} />
        </g>
      );
    case "payload":
      return (
        <g>
          <rect x={L + 5} y={y} width={w - 10} height={42} rx={3} fill={c.bodyHi} stroke={c.stroke} strokeDasharray="3 2" />
          <circle cx={cx} cy={y + 21} r={5} fill="hsl(var(--chart-4))" />
        </g>
      );
    case "battery":
      return (
        <g>
          <rect x={L + 5} y={y} width={w - 10} height={30} rx={3} fill={c.struct} />
          <rect x={L + 9} y={y + 5} width={8} height={20} rx={1} fill={c.bodyHi} />
          <rect x={cx - 4} y={y + 5} width={8} height={20} rx={1} fill={c.bodyHi} />
          <rect x={R - 17} y={y + 5} width={8} height={20} rx={1} fill={c.bodyHi} />
        </g>
      );
    case "heat_shield":
      return <polygon points={pts([[L - 4, y + 18], [R + 4, y + 18], [R, y], [L, y]])} fill={c.struct} />;
    case "liquid_engine":
      return (
        <g>
          <rect x={cx - 12} y={y} width={24} height={12} rx={3} fill={c.engine} />
          <polygon points={pts([[cx - 10, y + 12], [cx + 10, y + 12], [cx + 18, y + 44], [cx - 18, y + 44]])} fill={c.engine} />
          <line x1={cx - 6} y1={y + 22} x2={cx + 6} y2={y + 22} stroke={c.stroke} strokeWidth={1} />
        </g>
      );
    case "jet_engine":
      return (
        <g>
          <rect x={cx - 12} y={y} width={24} height={14} rx={4} fill={c.engine} />
          <circle cx={cx} cy={y + 7} r={4} fill={c.bodyHi} />
          <polygon points={pts([[cx - 10, y + 14], [cx + 10, y + 14], [cx + 14, y + 36], [cx - 14, y + 36]])} fill={c.engine} />
        </g>
      );
    case "turboshaft":
      return (
        <g>
          <rect x={cx - 14} y={y + 6} width={28} height={30} rx={4} fill={c.engine} />
          <circle cx={cx} cy={y + 4} r={7} fill={c.engine} />
          <line x1={cx - 10} y1={y + 4} x2={cx + 10} y2={y + 4} stroke={c.bodyHi} strokeWidth={1.5} />
          <line x1={cx} y1={y - 3} x2={cx} y2={y + 11} stroke={c.bodyHi} strokeWidth={1.5} />
        </g>
      );
    case "rotor_blade":
      return (
        <g>
          <line x1={cx} y1={y} x2={cx} y2={y + 12} stroke={c.engine} strokeWidth={2} />
          <ellipse cx={cx} cy={y} rx={48} ry={4} fill={c.aero} opacity={0.55} />
        </g>
      );
    case "wheel":
      return (
        <g>
          <line x1={cx - 16} y1={y - 6} x2={cx - 16} y2={y + 4} stroke={c.engine} strokeWidth={2} />
          <line x1={cx + 16} y1={y - 6} x2={cx + 16} y2={y + 4} stroke={c.engine} strokeWidth={2} />
          <circle cx={cx - 16} cy={y + 8} r={8} fill={c.gear} />
          <circle cx={cx + 16} cy={y + 8} r={8} fill={c.gear} />
          <circle cx={cx - 16} cy={y + 8} r={3} fill={c.bodyHi} />
          <circle cx={cx + 16} cy={y + 8} r={3} fill={c.bodyHi} />
        </g>
      );
    case "fin": {
      const fy = y;
      return (
        <g>
          <polygon points={pts([[L, fy], [L, fy + 24], [L - 28, fy + 24]])} fill={c.aero} />
          <polygon points={pts([[R, fy], [R, fy + 24], [R + 28, fy + 24]])} fill={c.aero} />
        </g>
      );
    }
    case "wing": {
      const wy = y;
      return (
        <g>
          <polygon points={pts([[L, wy - 4], [L, wy + 12], [L - 36, wy + 18], [L - 36, wy + 2]])} fill={c.aero} />
          <polygon points={pts([[R, wy - 4], [R, wy + 12], [R + 36, wy + 18], [R + 36, wy + 2]])} fill={c.aero} />
        </g>
      );
    }
    case "canard": {
      const cy = y;
      return (
        <g>
          <polygon points={pts([[L, cy - 3], [L, cy + 9], [L - 22, cy + 12], [L - 22, cy]])} fill={c.aero} />
          <polygon points={pts([[R, cy - 3], [R, cy + 9], [R + 22, cy + 12], [R + 22, cy]])} fill={c.aero} />
        </g>
      );
    }
    default:
      return null;
  }
}

// Side-mounted solid booster spanning [top, bottom].
export function drawBooster(cx, top, bottom, colors = COLORS) {
  const bw = 16;
  const L = cx - bw / 2;
  const R = cx + bw / 2;
  const nozH = 14;
  const bodyH = Math.max(20, bottom - top - nozH);
  return (
    <g>
      <rect x={L} y={top} width={bw} height={bodyH} rx={3} fill={colors.engine} />
      <rect x={L} y={top} width={Math.max(4, bw * 0.3)} height={bodyH} rx={3} fill={colors.bodyHi} />
      <polygon points={pts([[L, top + bodyH], [R, top + bodyH], [R + 4, bottom], [L - 4, bottom]])} fill={colors.engine} />
    </g>
  );
}

// Compact 48x48 glyph for catalog cards.
export function drawGlyph(id, colors = COLORS) {
  const c = colors;
  const cx = 24;
  const w = 16;
  const L = cx - w / 2;
  const R = cx + w / 2;
  switch (id) {
    case "nose_cone":
      return <polygon points={pts([[L, 40], [R, 40], [cx, 8]])} fill={c.body} />;
    case "fuel_tank":
      return (
        <g>
          <rect x={L} y={8} width={w} height={32} rx={3} fill={c.body} />
          <rect x={L} y={8} width={4} height={32} rx={2} fill={c.bodyHi} />
        </g>
      );
    case "payload":
      return <rect x={L + 2} y={12} width={w - 4} height={26} rx={2} fill={c.bodyHi} stroke={c.stroke} strokeDasharray="2 2" />;
    case "battery":
      return (
        <g>
          <rect x={L + 2} y={12} width={w - 4} height={24} rx={2} fill={c.struct} />
          <rect x={L + 4} y={16} width={3} height={16} fill={c.bodyHi} />
          <rect x={cx - 1.5} y={16} width={3} height={16} fill={c.bodyHi} />
          <rect x={R - 6} y={16} width={3} height={16} fill={c.bodyHi} />
        </g>
      );
    case "heat_shield":
      return <polygon points={pts([[L - 2, 38], [R + 2, 38], [R, 14], [L, 14]])} fill={c.struct} />;
    case "liquid_engine":
      return (
        <g>
          <rect x={cx - 7} y={10} width={14} height={8} rx={2} fill={c.engine} />
          <polygon points={pts([[cx - 6, 18], [cx + 6, 18], [cx + 10, 38], [cx - 10, 38]])} fill={c.engine} />
        </g>
      );
    case "solid_booster":
      return (
        <g>
          <rect x={cx - 6} y={8} width={12} height={24} rx={2} fill={c.engine} />
          <rect x={cx - 6} y={8} width={3} height={24} rx={1} fill={c.bodyHi} />
          <polygon points={pts([[cx - 5, 32], [cx + 5, 32], [cx + 8, 40], [cx - 8, 40]])} fill={c.engine} />
        </g>
      );
    case "jet_engine":
      return (
        <g>
          <rect x={cx - 7} y={10} width={14} height={10} rx={3} fill={c.engine} />
          <circle cx={cx} cy={15} r={3} fill={c.bodyHi} />
          <polygon points={pts([[cx - 6, 20], [cx + 6, 20], [cx + 9, 38], [cx - 9, 38]])} fill={c.engine} />
        </g>
      );
    case "turboshaft":
      return (
        <g>
          <rect x={cx - 8} y={16} width={16} height={22} rx={3} fill={c.engine} />
          <circle cx={cx} cy={13} r={5} fill={c.engine} />
          <line x1={cx - 7} y1={13} x2={cx + 7} y2={13} stroke={c.bodyHi} strokeWidth={1.5} />
        </g>
      );
    case "rotor_blade":
      return (
        <g>
          <line x1={cx} y1={10} x2={cx} y2={26} stroke={c.engine} strokeWidth={2} />
          <ellipse cx={cx} cy={10} rx={20} ry={3} fill={c.aero} opacity={0.6} />
          <rect x={cx - 3} y={26} width={6} height={12} fill={c.engine} />
        </g>
      );
    case "fin":
      return <polygon points={pts([[cx - 3, 10], [cx - 3, 34], [cx - 16, 38], [cx - 16, 18]])} fill={c.aero} />;
    case "wing":
      return <polygon points={pts([[cx - 2, 14], [cx - 2, 30], [cx - 18, 34], [cx - 18, 20]])} fill={c.aero} />;
    case "canard":
      return <polygon points={pts([[cx - 2, 16], [cx - 2, 28], [cx - 14, 31], [cx - 14, 19]])} fill={c.aero} />;
    case "wheel":
      return (
        <g>
          <circle cx={cx} cy={26} r={10} fill={c.gear} />
          <circle cx={cx} cy={26} r={4} fill={c.bodyHi} />
        </g>
      );
    default:
      return null;
  }
}