import React, { useRef } from "react";
import { ZoomIn, ZoomOut, Plus, Scissors, Trash2, Maximize2 } from "lucide-react";

const TRACK_H = 56;

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

export default function Timeline(props) {
  const {
    project, pxPerSec, currentTime, selectedClipId,
    onSelectClip, onMoveClip, onTrimClip, onSplitClip, onDeleteClip,
    onAddTrack, onSeek, onZoomIn, onZoomOut, onFit, onClipInteractionStart,
  } = props;
  const dragRef = useRef(null);
  const width = (project.duration || 60) * pxPerSec;

  const onPointerDownClip = (e, clip, mode) => {
    e.preventDefault(); e.stopPropagation();
    onSelectClip(clip.id);
    onClipInteractionStart?.();
    dragRef.current = { mode, startX: e.clientX, orig: { start: clip.start, duration: clip.duration, sourceStart: clip.sourceStart }, id: clip.id };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };
  const onPointerMove = (e) => {
    const d = dragRef.current; if (!d) return;
    const dt = (e.clientX - d.startX) / pxPerSec;
    const snap = (v) => Math.round(v * 10) / 10;
    if (d.mode === "move") {
      onMoveClip(d.id, { start: Math.max(0, snap(d.orig.start + dt)) });
    } else if (d.mode === "trimL") {
      const delta = snap(dt);
      const ns = Math.max(0, d.orig.start + delta);
      const nss = Math.max(0, d.orig.sourceStart + delta);
      const nd = Math.max(0.1, d.orig.duration - (ns - d.orig.start));
      onTrimClip(d.id, { start: ns, sourceStart: nss, duration: nd });
    } else if (d.mode === "trimR") {
      onTrimClip(d.id, { duration: Math.max(0.1, snap(d.orig.duration + dt)) });
    }
  };
  const onPointerUp = () => {
    dragRef.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
  };

  const ticks = [];
  for (let t = 0; t <= (project.duration || 60); t += 5) ticks.push(t);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
        <button onClick={onAddTrack} className="flex items-center gap-1 rounded-md border border-border/60 px-2.5 py-1.5 text-xs hover:border-primary hover:text-primary">
          <Plus className="h-3.5 w-3.5" /> Track
        </button>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onZoomOut} className="rounded-md p-1.5 hover:bg-foreground/5"><ZoomOut className="h-4 w-4" /></button>
          <button onClick={onZoomIn} className="rounded-md p-1.5 hover:bg-foreground/5"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={onFit} className="rounded-md p-1.5 hover:bg-foreground/5" title="Fit"><Maximize2 className="h-4 w-4" /></button>
        </div>
        {selectedClipId && (
          <div className="flex items-center gap-1">
            <button onClick={onSplitClip} className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1.5 text-xs hover:border-primary hover:text-primary"><Scissors className="h-3.5 w-3.5" /> Split</button>
            <button onClick={onDeleteClip} className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1.5 text-xs text-destructive hover:border-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>

      <div className="relative flex-1 overflow-auto bg-background/40">
        <div className="relative" style={{ width: Math.max(width, 1200) }}>
          <div
            className="sticky top-0 z-10 h-7 border-b border-border/40 bg-background/80 backdrop-blur"
            onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek((e.clientX - r.left) / pxPerSec); }}
          >
            <div className="relative h-full">
              {ticks.map((t) => (
                <div key={t} className="absolute top-0 h-full border-l border-border/30" style={{ left: t * pxPerSec }}>
                  <span className="ml-1 font-mono text-[9px] text-muted-foreground">{fmt(t)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 z-20 h-full w-px bg-primary" style={{ left: currentTime * pxPerSec }}>
            <div className="absolute -top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-primary" />
          </div>

          {project.tracks.map((tr, idx) => (
            <div
              key={tr.id}
              className="relative border-b border-border/30"
              style={{ height: tr.height || TRACK_H, background: idx % 2 ? "transparent" : "rgba(168,85,247,0.03)" }}
              onPointerDown={(e) => { if (e.target === e.currentTarget) onSelectClip(null); }}
            >
              {project.clips.filter((c) => c.trackId === tr.id).map((clip) => {
                const color = clip.color || tr.color || "#a855f7";
                return (
                  <div
                    key={clip.id}
                    onPointerDown={(e) => onPointerDownClip(e, clip, "move")}
                    className={`group absolute top-1 bottom-1 cursor-grab overflow-hidden rounded-md border ${selectedClipId === clip.id ? "border-primary" : "border-border/60"}`}
                    style={{ left: clip.start * pxPerSec, width: Math.max(10, clip.duration * pxPerSec), background: color + "33" }}
                  >
                    <div className="flex h-full items-center px-2">
                      <span className="truncate font-mono text-[10px] text-foreground/80">{clip.name}</span>
                    </div>
                    <div onPointerDown={(e) => onPointerDownClip(e, clip, "trimL")} className="absolute left-0 top-0 h-full w-1.5 cursor-ew-resize bg-foreground/20 opacity-0 group-hover:opacity-100" />
                    <div onPointerDown={(e) => onPointerDownClip(e, clip, "trimR")} className="absolute right-0 top-0 h-full w-1.5 cursor-ew-resize bg-foreground/20 opacity-0 group-hover:opacity-100" />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/40 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
        {fmt(currentTime)} / {fmt(project.duration || 60)} · {project.tracks.length} tracks · {project.clips.length} clips · {pxPerSec.toFixed(0)}px/s
      </div>
    </div>
  );
}