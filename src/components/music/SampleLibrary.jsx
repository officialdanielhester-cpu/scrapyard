import React, { useRef } from "react";
import { Mic, Upload, Music2, Sparkles, Loader2, Piano, FileMusic, Download, History, Users } from "lucide-react";
import { BUILTIN_SAMPLES } from "@/components/music/audioEngine";

export default function SampleLibrary({ onAddClip, onImportFile, recording, onRecord, onStopRecord, onAIBeat, aiBusy, onTools, onMidiImport, onMidiExport, onHistory, onCollab }) {
  const fileRef = useRef(null);
  return (
    <div className="space-y-1 border-t border-border/40 bg-background/40">
      <div className="flex flex-wrap items-center gap-2 px-3 pt-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Library</span>
        {Object.entries(BUILTIN_SAMPLES).map(([id, s]) => (
          <button key={id} onClick={() => onAddClip("builtin:" + id)} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
            <Music2 className="h-3 w-3" /> {s.name}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
          <Upload className="h-3 w-3" /> Import Audio
        </button>
        <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onImportFile(f); e.target.value = ""; }} />
        <button onClick={onMidiImport} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
          <FileMusic className="h-3 w-3" /> MIDI In
        </button>
        <button onClick={onMidiExport} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
          <Download className="h-3 w-3" /> MIDI Out
        </button>
        <button onClick={onTools} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
          <Piano className="h-3 w-3" /> Piano / Pads
        </button>
        <button onClick={onAIBeat} disabled={aiBusy} className="flex items-center gap-1.5 rounded-full border border-primary/60 bg-primary/5 px-3 py-1.5 text-xs text-primary hover:bg-primary/10 disabled:opacity-40">
          {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI Beat
        </button>
        <button onClick={onHistory} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
          <History className="h-3 w-3" /> History
        </button>
        <button onClick={onCollab} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
          <Users className="h-3 w-3" /> Collab
        </button>
        {recording ? (
          <button onClick={onStopRecord} className="flex items-center gap-1.5 rounded-full bg-destructive px-3 py-1.5 text-xs text-destructive-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Stop
          </button>
        ) : (
          <button onClick={onRecord} className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">
            <Mic className="h-3 w-3" /> Record
          </button>
        )}
      </div>
    </div>
  );
}