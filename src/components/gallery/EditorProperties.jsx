import React from "react";
import { Film, Type, Trash2 } from "lucide-react";

const fmt = (s) => {
  if (!isFinite(s)) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function EditorProperties({ clip, text, onUpdateClip, onDeleteClip, onUpdateText, onDeleteText }) {
  if (text) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/50 p-4">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Text</h3>
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Content</span>
          <input value={text.content} onChange={(e) => onUpdateText({ content: e.target.value })} className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none" />
        </label>
        <div>
          <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Color</span>
          <input type="color" value={text.color} onChange={(e) => onUpdateText({ color: e.target.value })} className="h-8 w-full cursor-pointer rounded border border-border/60 bg-transparent" />
        </div>
        <div>
          <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Size {text.size.toFixed(1)}</span>
          <input type="range" min="2" max="14" step="0.5" value={text.size} onChange={(e) => onUpdateText({ size: Number(e.target.value) })} className="w-full accent-primary" />
        </div>
        <button onClick={onDeleteText} className="flex items-center gap-1.5 text-xs text-destructive transition-colors hover:underline">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Delete text
        </button>
      </div>
    );
  }

  if (clip) {
    return (
      <div className="space-y-3 rounded-2xl border border-border/50 p-4">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Clip</h3>
        </div>
        <p className="truncate text-sm text-foreground/80">{clip.name}</p>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <span className="text-muted-foreground">Type</span>
          <span className="text-right capitalize">{clip.type}</span>
          <span className="text-muted-foreground">Duration</span>
          <span className="text-right font-mono">{fmt(clip.dur)}</span>
          {clip.type === "video" && (
            <>
              <span className="text-muted-foreground">Start offset</span>
              <span className="text-right font-mono">{fmt(clip.offset || 0)}</span>
            </>
          )}
        </div>
        <label className="block">
          <span className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">Duration (s)</span>
          <input type="number" min="0.1" step="0.1" value={clip.dur.toFixed(2)} onChange={(e) => onUpdateClip({ dur: Math.max(0.1, Number(e.target.value) || 0.1) })} className="w-full rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm focus:border-primary focus:outline-none" />
        </label>
        <button onClick={onDeleteClip} className="flex items-center gap-1.5 text-xs text-destructive transition-colors hover:underline">
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} /> Delete clip
        </button>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
          Use the scissors to split at the playhead
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/60 p-4 text-center">
      <p className="text-xs text-muted-foreground">Select a clip or text to edit</p>
    </div>
  );
}