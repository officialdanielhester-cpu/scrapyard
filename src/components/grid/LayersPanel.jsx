import React, { useEffect, useRef } from "react";
import { Plus, Trash2, Eye, EyeOff, Copy, Combine, ChevronUp, ChevronDown, Layers as LayersIcon } from "lucide-react";

function drawChecker(ctx, w, h) {
  const s = 6;
  for (let y = 0; y < h; y += s) {
    for (let x = 0; x < w; x += s) {
      ctx.fillStyle = ((x / s + y / s) % 2 === 0) ? "#ffffff" : "#d1d5db";
      ctx.fillRect(x, y, s, s);
    }
  }
}

function LayerThumb({ id, canvasMapRef, version }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    drawChecker(ctx, c.width, c.height);
    const src = canvasMapRef.current.get(id);
    if (src) ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, c.width, c.height);
  }, [id, version, canvasMapRef]);
  return <canvas ref={ref} width={48} height={34} className="rounded border border-border/60" />;
}

const IconBtn = ({ onClick, disabled, title, children, danger }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30 ${danger ? "hover:text-destructive" : ""}`}
  >
    {children}
  </button>
);

export default function LayersPanel({
  className,
  layers,
  activeId,
  onSelect,
  onAdd,
  onDelete,
  onToggleVisible,
  onOpacity,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onMergeDown,
  canvasMapRef,
  version,
}) {
  const ordered = [...layers].reverse();
  return (
    <aside className={className}>
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <LayersIcon className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Layers</span>
          </div>
          <button
            onClick={onAdd}
            title="Add layer"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
          {ordered.length === 0 && (
            <p className="px-2 py-6 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              No layers
            </p>
          )}
          {ordered.map((l) => {
            const realIdx = layers.findIndex((x) => x.id === l.id);
            const active = l.id === activeId;
            return (
              <div
                key={l.id}
                className={`rounded-lg border p-2 transition-colors ${active ? "border-primary bg-primary/5" : "border-border/50"}`}
              >
                <div className="flex items-center gap-2">
                  <button onClick={() => onSelect(l.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                    <LayerThumb id={l.id} canvasMapRef={canvasMapRef} version={version} />
                    <span className="truncate text-xs text-foreground">{l.name}</span>
                  </button>
                  <button
                    onClick={() => onToggleVisible(l.id)}
                    className={`flex h-6 w-6 items-center justify-center rounded ${l.visible ? "text-foreground" : "text-muted-foreground/40"}`}
                    title={l.visible ? "Hide" : "Show"}
                  >
                    {l.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>

                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(l.opacity * 100)}
                    onChange={(e) => onOpacity(l.id, Number(e.target.value) / 100)}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-7 text-right font-mono text-[9px] text-muted-foreground">
                    {Math.round(l.opacity * 100)}
                  </span>
                </div>

                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-0.5">
                    <IconBtn onClick={() => onMoveUp(l.id)} disabled={realIdx === layers.length - 1} title="Move up">
                      <ChevronUp className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn onClick={() => onMoveDown(l.id)} disabled={realIdx === 0} title="Move down">
                      <ChevronDown className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <IconBtn onClick={() => onDuplicate(l.id)} title="Duplicate">
                      <Copy className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn onClick={() => onMergeDown(l.id)} disabled={realIdx === 0} title="Merge down">
                      <Combine className="h-3.5 w-3.5" />
                    </IconBtn>
                    <IconBtn onClick={() => onDelete(l.id)} disabled={layers.length <= 1} title="Delete" danger>
                      <Trash2 className="h-3.5 w-3.5" />
                    </IconBtn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}