import React from "react";
import { Volume2, Trash2 } from "lucide-react";
import { INSTRUMENTS, NOTE_NAMES } from "@/components/sound/SoundEngine";

export default function TrackRow({ track, currentStep, onToggleStep, onVolume, onMute, onRootNote, onRemove }) {
  const inst = INSTRUMENTS.find((i) => i.id === track.instrument) || INSTRUMENTS[0];

  return (
    <div className="flex items-stretch border-b border-border/30 last:border-b-0">
      {/* Track header — BandLab-style lane control strip */}
      <div className="flex w-56 shrink-0 flex-col justify-center gap-1.5 border-r border-border/30 bg-background/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-1 shrink-0 rounded-full" style={{ background: inst.color }} />
          <span className="truncate font-body text-sm font-medium text-foreground/90">{track.name}</span>
          {onRemove && (
            <button onClick={() => onRemove(track.id)} className="ml-auto shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMute(track.id)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold transition-colors ${
              track.muted ? "bg-destructive text-destructive-foreground" : "bg-foreground/10 text-muted-foreground hover:bg-foreground/20"
            }`}
            title={track.muted ? "Unmute" : "Mute"}
          >
            M
          </button>
          <Volume2 className={`h-3.5 w-3.5 shrink-0 ${track.muted ? "text-muted-foreground/30" : "text-muted-foreground"}`} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={track.volume}
            onChange={(e) => onVolume(track.id, Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-primary"
          />
          {inst.melodic ? (
            <select
              value={track.rootNote}
              onChange={(e) => onRootNote(track.id, Number(e.target.value))}
              className="w-10 shrink-0 rounded border border-border/50 bg-background px-1 py-0.5 font-mono text-[10px] text-foreground/70 focus:border-primary focus:outline-none"
            >
              {NOTE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
            </select>
          ) : (
            <div className="w-10 shrink-0" />
          )}
        </div>
      </div>

      {/* Step grid */}
      <div className="flex flex-1 items-center gap-1 px-2 py-2">
        {track.steps.map((on, i) => {
          const isCurrent = i === currentStep;
          const beatGroup = Math.floor(i / 4) % 2 === 0;
          return (
            <button
              key={i}
              onClick={() => onToggleStep(track.id, i)}
              className={`h-8 flex-1 rounded transition-all ${
                on
                  ? "shadow-sm"
                  : beatGroup
                    ? "bg-foreground/8 hover:bg-foreground/15"
                    : "bg-foreground/4 hover:bg-foreground/10"
              } ${isCurrent ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}`}
              style={on ? { background: inst.color, opacity: track.muted ? 0.3 : 1 } : {}}
            />
          );
        })}
      </div>
    </div>
  );
}