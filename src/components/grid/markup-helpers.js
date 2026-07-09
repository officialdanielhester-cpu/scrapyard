export const MARKUP_TOOLS = ["pen", "pencil", "marker", "brush", "highlighter", "airbrush", "calligraphy", "crayon", "ink", "chalk", "eraser"];

export const MARKUP_COLORS = ["#3B82F6", "#EF4444", "#22C55E", "#F59E0B", "#A855F7", "#FFFFFF", "#0F172A"];

export function styleFor(ctx, tool, color, width) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
  const w = width || 4;
  switch (tool) {
    case "pen":
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w; break;
    case "pencil":
      ctx.globalAlpha = 0.55; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = Math.max(1, w * 0.6); break;
    case "marker":
      ctx.globalAlpha = 0.7; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w * 1.8; break;
    case "brush":
      ctx.globalAlpha = 0.85; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w * 1.4;
      ctx.shadowBlur = w * 0.8; ctx.shadowColor = color; break;
    case "highlighter":
      ctx.globalAlpha = 0.3; ctx.globalCompositeOperation = "multiply"; ctx.lineWidth = w * 3.2; break;
    case "airbrush":
      ctx.globalAlpha = 0.16; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w * 2.2;
      ctx.shadowBlur = w * 2.4; ctx.shadowColor = color; break;
    case "calligraphy":
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      ctx.lineCap = "butt"; ctx.lineJoin = "miter"; ctx.lineWidth = w * 1.6; break;
    case "crayon":
      ctx.globalAlpha = 0.75; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w * 1.1;
      ctx.setLineDash([w * 0.5, w * 0.4]); break;
    case "ink":
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w * 1.3; break;
    case "chalk":
      ctx.globalAlpha = 0.45; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w * 1.5;
      ctx.setLineDash([w * 0.3, w * 0.35]); break;
    case "eraser":
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "destination-out"; ctx.lineWidth = w * 2.5; break;
    default:
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over"; ctx.lineWidth = w;
  }
}

export function drawStroke(ctx, stroke, w, h) {
  if (stroke.tool === "eraser") return;
  const pts = stroke.points || [];
  if (!pts.length) return;
  styleFor(ctx, stroke.tool, stroke.color, stroke.width);
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i][0] * w, pts[i][1] * h);
  }
  if (pts.length === 1) {
    ctx.lineTo(pts[0][0] * w + 0.01, pts[0][1] * h);
  }
  ctx.stroke();
}

export function eraseNear(strokes, path, radius) {
  if (!path || !path.length) return strokes;
  const r2 = radius * radius;
  return strokes.filter((s) => {
    const pts = s.points || [];
    for (const p of pts) {
      for (const e of path) {
        const dx = p[0] - e[0];
        const dy = p[1] - e[1];
        if (dx * dx + dy * dy <= r2) return false;
      }
    }
    return true;
  });
}