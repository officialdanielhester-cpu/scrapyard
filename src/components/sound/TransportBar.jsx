import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Square, Save, FilePlus, Trash2, Dice5, Plus, Volume2 } from "lucide-react";
import { INSTRUMENTS } from "@/components/sound/SoundEngine";

export default function TransportBar({
  isPlaying, onPlay, onStop, bpm, setBpm, currentStep, masterVolume, setMasterVolume,
  onNew, onSave, onClear, onRandom, onAddTrack,
  projectName, setProjectName, loading,
}) {
  const [addOpen, setAddOpen] = useState(false);
  const addRef = useRef(null);

  useEffect(() => {
    if (!addOpen) return;
    const onDoc = (e) => { if (addRef.current && !addRef.current.contains(e.target)) setAddOpen(false); };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [addOpen]);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border/40 bg-background/50 px-6 py-3 md:px-12">
      {/* Transport: play/pause + stop */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlay}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:opacity-90"
        >
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
        </button>
        <button
          onClick={onStop}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-foreground/70 transition-colors hover:bg-foreground/5"
        >
          <Square className="h-4 w-4" />
        </button>
      </div>

      {/* BPM + step position */}
      <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">BPM</span>
          <input
            type="number"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value) || 120)))}
            className="w-12 bg-transparent font-mono text-lg font-bold text-foreground focus:outline-none"
          />
        </div>
        <div className="h-6 w-px bg-border/40" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Step</span>
          <span className="font-mono text-sm font-bold text-primary">{currentStep >= 0 ? currentStep + 1 : "--"}/16</span>
        </div>
      </div>

      {/* Master volume */}
      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/50 px-4 py-2">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={masterVolume}
          onChange={(e) => setMasterVolume(Number(e.target.value))}
          className="h-1.5 w-20 cursor-pointer accent-primary"
        />
        <span className="font-mono text-[10px] uppercase text-muted-foreground/60">Master</span>
      </div>

      {/* Position indicator dots */}
      <div className="hidden items-center gap-1 lg:flex">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i === currentStep ? "bg-primary" : i % 4 === 0 ? "bg-foreground/20" : "bg-foreground/8"
            }`}
          />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-36 rounded-lg border border-border/50 bg-background px-3 py-2 font-body text-sm focus:border-primary focus:outline-none"
          placeholder="Project name"
        />

        {/* Add track dropdown */}
        <div className="relative" ref={addRef}>
          <button
            onClick={() => setAddOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-4 w-4" /> Track
          </button>
          {addOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 grid w-48 grid-cols-2 gap-1 rounded-lg border border-border/60 bg-background p-2 shadow-lg">
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => { onAddTrack(inst.id); setAddOpen(false); }}
                  className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground/80 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <div className="h-2 w-2 shrink-0 rounded-full" style={{ background: inst.color }} />
                  {inst.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onRandom} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary">
          <Dice5 className="h-4 w-4" />
        </button>
        <button onClick={onClear} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
        <button onClick={onNew} className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary">
          <FilePlus className="h-4 w-4" />
        </button>
        <button onClick={onSave} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-mono text-xs uppercase text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50">
          <Save className="h-4 w-4" /> {loading ? "…" : "Save"}
        </button>
      </div>
    </div>
  );
}