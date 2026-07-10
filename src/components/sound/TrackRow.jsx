import React from "react";
import { Volume2, VolumeX, Trash2 } from "lucide-react";
import { INSTRUMENTS, NOTE_NAMES } from "@/components/sound/SoundEngine";

export default function TrackRow({ track, currentStep, onToggleStep, onVolume, onMute, onRootNote, onRemove }) {
  const inst = INSTRUMENTS.find((i) => i.id === track.instrument) || INSTRUMENTS[0];

  return (
    <div className="flex items-center gap-2 border-b border-border/30 py-1.5">
      {/* Track label */}
      <div className="flex w-28 shrink-0 items-center gap-1.5">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: inst.color }} />
        <span className="truncate font-mono text-[11px] text-foreground/80">{track.name}</span>
        {onRemove && (
          <button onClick={() => onRemove(track.id)} className="shrink-0 text-muted-foreground/40 transition-colors hover:text-destructive">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Mute + volume */}
      <div className="flex w-20 shrink-0 items-center gap-1.5">
        <button
          onClick={() => onMute(track.id)}
          className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${track.muted ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
        >
          {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={track.volume}
          onChange={(e) => onVolume(track.id, Number(e.target.value))}
          className="h-1 w-12 cursor-pointer accent-primary"
        />
      </div>

      {/* Root note selector for melodic tracks */}
      {inst.melodic ? (
        <select
          value={track.rootNote}
          onChange={(e) => onRootNote(track.id, Number(e.target.value))}
          className="w-12 shrink-0 rounded border border-border/50 bg-background px-1 py-0.5 font-mono text-[10px] text-foreground/70 focus:border-primary focus:outline-none"
        >
          {NOTE_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
        </select>
      ) : (
        <div className="w-12 shrink-0" />
      )}

      {/* Step grid */}
      <div className="flex flex-1 gap-1">
        {track.steps.map((on, i) => {
          const isCurrent = i === currentStep;
          const beatGroup = Math.floor(i / 4) % 2 === 0;
          return (
            <button
              key={i}
              onClick={() => onToggleStep(track.id, i)}
              className={`h-7 flex-1 rounded transition-all ${
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