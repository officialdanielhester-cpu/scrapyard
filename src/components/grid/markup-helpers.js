export const MARKUP_TOOLS = ["pen", "marker", "highlighter"];

export const MARKUP_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#22C55E",
  "#F59E0B",
  "#A855F7",
  "#FFFFFF",
  "#0F172A",
];

export function styleFor(ctx, tool, color, width) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  if (tool === "pen") {
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = width;
  } else if (tool === "marker") {
    ctx.globalAlpha = 0.7;
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = width * 1.8;
  } else {
    // highlighter
    ctx.globalAlpha = 0.3;
    ctx.globalCompositeOperation = "multiply";
    ctx.lineWidth = width * 3.2;
  }
}

export function drawStroke(ctx, stroke, w, h) {
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