// Color + brush engine for The Grid paint studio.

export function hexToRgb(hex) {
  let h = String(hex || "#000000").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex(r, g, b) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

export function toRgba(hex, a) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

export function hsvToRgb(h, s, v) {
  h = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    switch (max) {
      case r: h = ((g - b) / d) % 6; break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

export function hexToHsv(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHsv(r, g, b);
}

export function hsvToHex(h, s, v) {
  const { r, g, b } = hsvToRgb(h, s, v);
  return rgbToHex(r, g, b);
}

// Each brush: how a dab is laid down. alpha multiplies opacity; spacing is a
// fraction of brush size between dabs; jitter/sizeJitter add texture; blend is
// the composite operation (highlighter multiplies, eraser cuts).
export const BRUSHES = [
  { id: "pen", label: "Pen", soft: false, alpha: 1, spacing: 0.12, jitter: 0, sizeJitter: 0, blend: "source-over" },
  { id: "ink", label: "Ink", soft: false, alpha: 1, spacing: 0.09, jitter: 0, sizeJitter: 0, blend: "source-over" },
  { id: "pencil", label: "Pencil", soft: false, alpha: 0.55, spacing: 0.1, jitter: 0.14, sizeJitter: 0.18, blend: "source-over" },
  { id: "brush", label: "Brush", soft: true, alpha: 0.85, spacing: 0.08, jitter: 0, sizeJitter: 0, blend: "source-over" },
  { id: "airbrush", label: "Airbrush", soft: true, alpha: 0.14, spacing: 0.05, jitter: 0, sizeJitter: 0, blend: "source-over" },
  { id: "marker", label: "Marker", soft: false, alpha: 0.9, spacing: 0.12, jitter: 0, sizeJitter: 0, blend: "source-over" },
  { id: "highlighter", label: "Highlight", soft: false, alpha: 0.35, spacing: 0.12, jitter: 0, sizeJitter: 0, blend: "multiply" },
  { id: "calligraphy", label: "Calligraphy", soft: false, alpha: 1, spacing: 0.1, jitter: 0, sizeJitter: 0, blend: "source-over" },
];

export const BRUSH_BY_ID = Object.fromEntries(BRUSHES.map((b) => [b.id, b]));

export const ERASER_DEF = { soft: false, alpha: 1, spacing: 0.1, jitter: 0, sizeJitter: 0, blend: "destination-out" };

export function stampDab(ctx, x, y, def, color, size, opacity) {
  const r = Math.max(0.5, size / 2);
  const a = (def.alpha ?? 1) * opacity;
  ctx.save();
  ctx.globalCompositeOperation = def.blend || "source-over";
  let px = x, py = y, rr = r;
  if (def.jitter) {
    px += (Math.random() - 0.5) * size * def.jitter;
    py += (Math.random() - 0.5) * size * def.jitter;
  }
  if (def.sizeJitter) {
    rr = r * (1 + (Math.random() - 0.5) * def.sizeJitter);
  }
  if (def.soft) {
    const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, toRgba(color, a));
    g.addColorStop(0.7, toRgba(color, a * 0.5));
    g.addColorStop(1, toRgba(color, 0));
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = toRgba(color, a);
  }
  ctx.beginPath();
  ctx.arc(px, py, rr, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawSegment(ctx, from, to, def, color, size, opacity) {
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const step = Math.max(0.5, size * (def.spacing ?? 0.12));
  const n = Math.max(1, Math.ceil(dist / step));
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    stampDab(ctx, from.x + dx * t, from.y + dy * t, def, color, size, opacity);
  }
  stampDab(ctx, to.x, to.y, def, color, size, opacity);
}

export function floodFill(ctx, w, h, x, y, hex, tolerance) {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const start = (y * w + x) * 4;
  const tr = d[start], tg = d[start + 1], tb = d[start + 2], ta = d[start + 3];
  const { r, g, b } = hexToRgb(hex);
  const tol = Math.round(tolerance * 255 * 4);
  const match = (i) =>
    Math.abs(d[i] - tr) + Math.abs(d[i + 1] - tg) + Math.abs(d[i + 2] - tb) + Math.abs(d[i + 3] - ta) <= tol;
  const visited = new Uint8Array(w * h);
  const stack = [start];
  visited[y * w + x] = 1;
  let guard = 0;
  const max = w * h * 4;
  while (stack.length && guard++ < max) {
    const i = stack.pop();
    if (!match(i)) continue;
    d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    const p = i / 4;
    const x0 = p % w;
    const y0 = (p / w) | 0;
    if (x0 > 0) { const ni = i - 4; if (!visited[p - 1] && match(ni)) { visited[p - 1] = 1; stack.push(ni); } }
    if (x0 < w - 1) { const ni = i + 4; if (!visited[p + 1] && match(ni)) { visited[p + 1] = 1; stack.push(ni); } }
    if (y0 > 0) { const ni = i - w * 4; if (!visited[p - w] && match(ni)) { visited[p - w] = 1; stack.push(ni); } }
    if (y0 < h - 1) { const ni = i + w * 4; if (!visited[p + w] && match(ni)) { visited[p + w] = 1; stack.push(ni); } }
  }
  ctx.putImageData(img, 0, 0);
}