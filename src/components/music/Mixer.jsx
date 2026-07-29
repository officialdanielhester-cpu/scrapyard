import React from "react";
import { Plus, Trash2, Volume2, VolumeX, Headphones } from "lucide-react";

function Meter({ level }) {
  return (
    <div className="flex h-16 w-3 flex-col-reverse overflow-hidden rounded bg-foreground/5">
      <div className="w-full bg-gradient-to-t from-emerald-500 via-yellow-400 to-red-500 transition-all duration-75" style={{ height: `${Math.min(100, level * 100)}%` }} />
    </div>
  );
}

export default function Mixer(props) {
  const { project, selectedTrackId, masterLevel, onSelectTrack, onAddTrack, onDeleteTrack, onSetTrackProp, onSetMasterVolume } = props;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Mixer</h3>
        <button onClick={onAddTrack} className="flex items-center gap-1 rounded-md border border-border/60 px-2 py-1 text-xs hover:border-primary hover:text-primary"><Plus className="h-3 w-3" /> Add</button>
      </div>

      <div className="flex items-end gap-2 rounded-xl border border-border/40 bg-background/30 p-3">
        <Meter level={masterLevel} />
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">Master</span>
            <span className="font-mono text-[10px] text-muted-foreground">{Math.round((project.masterVolume ?? 0.8) * 100)}%</span>
          </div>
          <input type="range" min="0" max="1" step="0.01" value={project.masterVolume ?? 0.8} onChange={(e) => onSetMasterVolume(Number(e.target.value))} className="w-full accent-primary" />
        </div>
      </div>

      <div className="space-y-1.5">
        {project.tracks.map((t) => (
          <div key={t.id} onClick={() => onSelectTrack(t.id)} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 cursor-pointer ${selectedTrackId === t.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/70"}`}>
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: t.color }} />
            <span className="flex-1 truncate text-xs">{t.name}</span>
            <input type="range" min="0" max="1" step="0.01" value={t.volume} onClick={(e) => e.stopPropagation()} onChange={(e) => onSetTrackProp(t.id, { volume: Number(e.target.value) })} className="w-16 accent-primary" />
            <button onClick={(e) => { e.stopPropagation(); onSetTrackProp(t.id, { muted: !t.muted }); }} className="rounded p-1 hover:bg-foreground/10">{t.muted ? <VolumeX className="h-3.5 w-3.5 text-destructive" /> : <Volume2 className="h-3.5 w-3.5" />}</button>
            <button onClick={(e) => { e.stopPropagation(); onSetTrackProp(t.id, { solo: !t.solo }); }} className={`rounded p-1 hover:bg-foreground/10 ${t.solo ? "text-primary" : ""}`}><Headphones className="h-3.5 w-3.5" /></button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteTrack(t.id); }} className="rounded p-1 hover:bg-foreground/10"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}