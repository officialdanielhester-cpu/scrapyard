import React, { useState, useRef, useEffect } from "react";
import { Play, Square, Save, FilePlus, Trash2, Dice5, Plus } from "lucide-react";
import { INSTRUMENTS } from "@/components/sound/SoundEngine";

function ToolbarButton({ icon: Icon, label, onClick, disabled, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex min-w-[52px] flex-col items-center gap-1 rounded-md px-3 py-1.5 transition-colors ${
        primary
          ? "bg-primary text-primary-foreground hover:opacity-90"
          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
      } disabled:opacity-40`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.5} />
      <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
    </button>
  );
}

function Group({ label, children }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1">{children}</div>
      <span className="px-1 font-mono text-[8px] uppercase tracking-wider text-muted-foreground/60">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="mx-1 h-10 w-px shrink-0 bg-border/40" />;
}

export default function SoundToolbar({
  isPlaying, onPlay, bpm, setBpm,
  onNew, onSave, onClear, onRandom,
  onAddTrack, projectName, setProjectName, loading,
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
    <div className="flex items-start gap-1 overflow-x-auto border-b border-border/40 bg-background/50 px-3 py-2">
      {/* File */}
      <Group label="File">
        <ToolbarButton icon={FilePlus} label="New" onClick={onNew} />
        <ToolbarButton icon={Save} label={loading ? "…" : "Save"} onClick={onSave} disabled={loading} />
      </Group>
      <Divider />

      {/* Edit */}
      <Group label="Edit">
        <ToolbarButton icon={Trash2} label="Clear" onClick={onClear} />
        <ToolbarButton icon={Dice5} label="Random" onClick={onRandom} />
      </Group>
      <Divider />

      {/* Transport */}
      <Group label="Transport">
        <ToolbarButton icon={isPlaying ? Square : Play} label={isPlaying ? "Stop" : "Play"} onClick={onPlay} primary />
        <div className="flex items-center gap-1.5 rounded-md border border-border/50 px-2.5 py-2">
          <span className="font-mono text-[9px] uppercase text-muted-foreground">BPM</span>
          <input
            type="number"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value) || 120)))}
            className="w-10 bg-transparent font-mono text-sm text-foreground focus:outline-none"
          />
        </div>
      </Group>
      <Divider />

      {/* Add Track */}
      <Group label="Tracks">
        <div className="relative" ref={addRef}>
          <button
            onClick={() => setAddOpen((o) => !o)}
            className="flex min-w-[52px] flex-col items-center gap-1 rounded-md px-3 py-1.5 text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Plus className="h-4 w-4" strokeWidth={1.5} />
            <span className="font-mono text-[9px] uppercase tracking-wider">Add</span>
          </button>
          {addOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 grid w-48 grid-cols-2 gap-1 rounded-lg border border-border/60 bg-background p-2 shadow-lg">
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
      </Group>
      <Divider />

      {/* Project */}
      <Group label="Project">
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-44 rounded-md border border-border/50 bg-background px-3 py-2 font-body text-sm focus:border-primary focus:outline-none"
          placeholder="Project name"
        />
      </Group>
    </div>
  );
}