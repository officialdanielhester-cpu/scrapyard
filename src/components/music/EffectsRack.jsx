import React from "react";
import { Wand2 } from "lucide-react";

const EQS = [["none", "Off"], ["lowpass", "Low Pass"], ["highpass", "High Pass"], ["boost", "Boost"]];

export default function EffectsRack({ track, onChange }) {
  if (!track) return <p className="text-xs text-muted-foreground">Select a track to edit effects.</p>;
  return (
    <div className="space-y-3">
      <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Effects · {track.name}</h3>
      <div>
        <label className="mb-1 block font-mono text-[10px] uppercase text-muted-foreground">EQ</label>
        <div className="grid grid-cols-2 gap-1.5">
          {EQS.map(([id, label]) => (
            <button key={id} onClick={() => onChange({ eq: id })} className={`rounded-md border px-2 py-1.5 text-xs ${track.eq === id ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-foreground/40"}`}>{label}</button>
          ))}
        </div>
      </div>
      <button onClick={() => onChange({ reverb: !track.reverb })} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs ${track.reverb ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-foreground/40"}`}>
        <span className="flex items-center gap-2"><Wand2 className="h-3.5 w-3.5" /> Reverb</span>
        <span className={`h-4 w-7 rounded-full p-0.5 transition-colors ${track.reverb ? "bg-primary" : "bg-foreground/20"}`}>
          <span className={`block h-3 w-3 rounded-full bg-background transition-transform ${track.reverb ? "translate-x-3" : ""}`} />
        </span>
      </button>
      <p className="font-mono text-[10px] text-muted-foreground/60">More effects (compressor, limiter, chorus, etc.) land next.</p>
    </div>
  );
}