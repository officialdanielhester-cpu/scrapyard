import React from "react";
import { Wand2, Activity, Waves } from "lucide-react";

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

      <button onClick={() => onChange({ compressor: !track.compressor })} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-xs ${track.compressor ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:border-foreground/40"}`}>
        <span className="flex items-center gap-2"><Activity className="h-3.5 w-3.5" /> Compressor</span>
        <span className={`h-4 w-7 rounded-full p-0.5 transition-colors ${track.compressor ? "bg-primary" : "bg-foreground/20"}`}>
          <span className={`block h-3 w-3 rounded-full bg-background transition-transform ${track.compressor ? "translate-x-3" : ""}`} />
        </span>
      </button>

      <div>
        <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground"><Waves className="h-3 w-3" /> Distortion {Math.round((track.distortion || 0) * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={track.distortion || 0} onChange={(e) => onChange({ distortion: Number(e.target.value) })} className="w-full accent-primary" />
      </div>

      <div>
        <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground"><Waves className="h-3 w-3" /> Flanger {Math.round((track.flanger || 0) * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={track.flanger || 0} onChange={(e) => onChange({ flanger: Number(e.target.value) })} className="w-full accent-primary" />
      </div>
      <div>
        <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground"><Waves className="h-3 w-3" /> Delay {Math.round((track.delay || 0) * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={track.delay || 0} onChange={(e) => onChange({ delay: Number(e.target.value) })} className="w-full accent-primary" />
      </div>
      <div>
        <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase text-muted-foreground"><Waves className="h-3 w-3" /> Tremolo {Math.round((track.tremolo || 0) * 100)}%</label>
        <input type="range" min="0" max="1" step="0.05" value={track.tremolo || 0} onChange={(e) => onChange({ tremolo: Number(e.target.value) })} className="w-full accent-primary" />
      </div>
    </div>
  );
}