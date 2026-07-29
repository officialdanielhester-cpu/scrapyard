import React from "react";
import { Play, Pause, Square, Repeat, Undo2, Redo2, Save, FolderOpen, Download, Circle } from "lucide-react";

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
};

export default function TransportBar(props) {
  const { playing, currentTime, duration, loop, bpm, projectName, canUndo, canRedo, saving, metronome, beat, exporting } = props;
  const btn = "flex items-center justify-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs transition-colors hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:text-foreground";

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border/40 bg-background/60 px-3 py-2 backdrop-blur">
      <button onClick={props.onPlay} className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90">
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <button onClick={props.onStop} className={btn}><Square className="h-3.5 w-3.5" /></button>
      <button onClick={props.onToggleLoop} className={loop ? "border-primary text-primary " + btn : btn}><Repeat className="h-3.5 w-3.5" /></button>
      <button onClick={props.onToggleMetronome} className={metronome ? "border-primary text-primary " + btn : btn} title="Metronome">
        <Circle className="h-3.5 w-3.5" />
        {metronome && <span key={beat} className="absolute -mt-3 h-1.5 w-1.5 animate-ping rounded-full bg-primary" />}
      </button>

      <div className="flex items-center gap-2 px-2">
        <span className="font-mono text-sm tabular-nums">{fmt(currentTime)}</span>
        <span className="font-mono text-xs text-muted-foreground">/ {fmt(duration)}</span>
      </div>

      <div className="mx-1 h-6 w-px bg-border/40" />

      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">BPM
        <input type="number" value={bpm} onChange={(e) => props.onSetBpm(Number(e.target.value) || 60)} className="w-16 rounded-md border border-border/60 bg-background px-2 py-1 text-xs" />
      </label>

      <input value={projectName} onChange={(e) => props.onSetProjectName(e.target.value)} className="min-w-[120px] flex-1 rounded-md border border-border/60 bg-background px-2 py-1 text-sm" />

      <button onClick={props.onExport} disabled={exporting} className={btn} title="Export WAV">
        {exporting ? "Rendering…" : <><Download className="h-3.5 w-3.5" /> WAV</>}
      </button>
      <button onClick={props.onExportStems} disabled={exporting} className={btn} title="Export per-track stems">
        <Download className="h-3.5 w-3.5" /> Stems
      </button>
      <button onClick={props.onUndo} disabled={!canUndo} className={btn}><Undo2 className="h-3.5 w-3.5" /></button>
      <button onClick={props.onRedo} disabled={!canRedo} className={btn}><Redo2 className="h-3.5 w-3.5" /></button>
      <button onClick={props.onSave} disabled={saving} className={btn}>{saving ? "Saving…" : <><Save className="h-3.5 w-3.5" /> Save</>}</button>
      <button onClick={props.onOpen} className={btn}><FolderOpen className="h-3.5 w-3.5" /></button>
    </div>
  );
}