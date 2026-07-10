import React from "react";
import { Play, Pause, Scissors, Trash2, ChevronLeft, ChevronRight, Film, Image as ImageIcon } from "lucide-react";

const fmt = (s) => {
  if (!isFinite(s)) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function EditorTimeline({
  clips, selectedId, currentTime, totalDur, playing,
  onSelect, onScrub, onSplit, onDelete, onMoveLeft, onMoveRight, onTogglePlay,
}) {
  const pct = totalDur ? Math.min(100, Math.max(0, (currentTime / totalDur) * 100)) : 0;
  const iconBtn = "flex h-8 w-8 items-center justify-center rounded-md border border-border/60 text-foreground/80 transition-colors hover:border-primary hover:text-primary disabled:opacity-40";

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2">
        <button onClick={onTogglePlay} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
        </button>
        <span className="font-mono text-[11px] text-muted-foreground">{fmt(currentTime)} / {fmt(totalDur)}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={onMoveLeft} disabled={!selectedId} className={iconBtn} title="Move left"><ChevronLeft className="h-4 w-4" strokeWidth={1.5} /></button>
          <button onClick={onMoveRight} disabled={!selectedId} className={iconBtn} title="Move right"><ChevronRight className="h-4 w-4" strokeWidth={1.5} /></button>
          <button onClick={onSplit} disabled={!selectedId} className={iconBtn} title="Split at playhead"><Scissors className="h-4 w-4" strokeWidth={1.5} /></button>
          <button onClick={onDelete} disabled={!selectedId} className={iconBtn} title="Delete"><Trash2 className="h-4 w-4" strokeWidth={1.5} /></button>
        </div>
      </div>

      {/* Scrubber track — kept separate so it never blocks clip selection */}
      <div className="relative h-5 w-full">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded bg-foreground/10" />
        <div className="absolute top-1/2 h-1 -translate-y-1/2 rounded bg-primary" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow" style={{ left: `${pct}%` }} />
        {totalDur > 0 && (
          <input type="range" min={0} max={totalDur} step={0.01} value={Math.min(currentTime, totalDur)} onChange={onScrub} className="absolute inset-0 w-full cursor-pointer opacity-0" />
        )}
      </div>

      {/* Clip blocks */}
      <div className="relative mt-2 h-16 w-full overflow-hidden rounded-lg border border-border/40 bg-background">
        {clips.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No clips yet — import media above</div>
        ) : (
          <div className="flex h-full gap-1 p-1">
            {clips.map((c) => {
              const w = totalDur ? (c.dur / totalDur) * 100 : 100 / clips.length;
              const sel = c.id === selectedId;
              return (
                <button key={c.id} onClick={() => onSelect(c.id)} style={{ width: `${w}%` }} className={`flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-md border text-[10px] transition-colors ${sel ? "border-primary bg-primary/15 text-primary" : "border-border/60 bg-foreground/5 text-muted-foreground hover:text-foreground"}`}>
                  {c.type === "video" ? <Film className="h-3.5 w-3.5" strokeWidth={1.5} /> : <ImageIcon className="h-3.5 w-3.5" strokeWidth={1.5} />}
                  <span className="max-w-full truncate px-1">{c.name}</span>
                  <span className="font-mono text-[9px] opacity-70">{fmt(c.dur)}</span>
                </button>
              );
            })}
          </div>
        )}
        {totalDur > 0 && (
          <div className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-primary/70" style={{ left: `${pct}%` }} />
        )}
      </div>
    </div>
  );
}