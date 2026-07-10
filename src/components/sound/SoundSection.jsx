import React, { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, Save, FilePlus, Trash2, Dice5, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SoundEngine, { INSTRUMENTS, DEFAULT_BEAT } from "@/components/sound/SoundEngine";
import TrackRow from "@/components/sound/TrackRow";

export default function SoundSection() {
  const [tracks, setTracks] = useState(DEFAULT_BEAT);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [projectName, setProjectName] = useState("Untitled Beat");
  const [savedId, setSavedId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const engineRef = useRef(null);

  useEffect(() => {
    engineRef.current = SoundEngine;
  }, []);

  // Load saved projects on mount
  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.SoundProject.list("-updated_date", 20);
        setProjects(list);
      } catch (e) { /* ignore on first load */ }
    })();
  }, []);

  // Sync engine with state
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTracks(tracks);
      engineRef.current.setBpm(bpm);
    }
  }, [tracks, bpm]);

  // Step callback
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.onStep = (step) => setCurrentStep(step);
    }
  }, []);

  const handlePlay = useCallback(() => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
      setCurrentStep(-1);
    } else {
      engineRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const toggleStep = (trackId, stepIdx) => {
    setTracks((prev) => prev.map((t) => {
      if (t.id !== trackId) return t;
      const steps = [...t.steps];
      steps[stepIdx] = steps[stepIdx] ? 0 : 1;
      return { ...t, steps };
    }));
  };

  const setVolume = (trackId, vol) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, volume: vol } : t)));
  };

  const toggleMute = (trackId) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)));
  };

  const setRootNote = (trackId, note) => {
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, rootNote: note } : t)));
  };

  const handleNew = () => {
    if (engineRef.current) engineRef.current.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
    setTracks(INSTRUMENTS.map((inst) => ({
      id: inst.id, name: inst.name, instrument: inst.id,
      volume: 0.7, muted: false, rootNote: 0, steps: Array(16).fill(0),
    })));
    setProjectName("Untitled Beat");
    setSavedId(null);
  };

  const handleRandomize = () => {
    setTracks((prev) => prev.map((t) => ({
      ...t,
      steps: t.steps.map(() => (Math.random() < 0.25 ? 1 : 0)),
    })));
  };

  const handleClear = () => {
    setTracks((prev) => prev.map((t) => ({ ...t, steps: Array(16).fill(0) })));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const payload = { name: projectName, bpm, tracks };
      if (savedId) {
        await base44.entities.SoundProject.update(savedId, payload);
      } else {
        const created = await base44.entities.SoundProject.create(payload);
        setSavedId(created.id);
      }
      const list = await base44.entities.SoundProject.list("-updated_date", 20);
      setProjects(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = (proj) => {
    if (engineRef.current) engineRef.current.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
    setTracks(proj.tracks?.length ? proj.tracks : DEFAULT_BEAT);
    setBpm(proj.bpm || 120);
    setProjectName(proj.name);
    setSavedId(proj.id);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/40 px-6 py-5 md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Sound</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Beat Maker Studio</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-40 rounded-lg border border-border/60 bg-background px-3 py-2 font-body text-sm focus:border-primary focus:outline-none"
            placeholder="Project name"
          />
          <div className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2">
            <span className="font-mono text-[10px] uppercase text-muted-foreground">BPM</span>
            <input
              type="number"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value) || 120)))}
              className="w-12 bg-transparent font-mono text-sm text-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={handlePlay}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all ${isPlaying ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground hover:opacity-90"}`}
          >
            {isPlaying ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPlaying ? "Stop" : "Play"}
          </button>
          <button onClick={handleRandomize} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary">
            <Dice5 className="h-4 w-4" /> Random
          </button>
          <button onClick={handleClear} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" /> Clear
          </button>
          <button onClick={handleNew} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary">
            <FilePlus className="h-4 w-4" /> New
          </button>
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary disabled:opacity-50">
            <Save className="h-4 w-4" /> {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sequencer */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12">
          <div className="mx-auto max-w-4xl">
            {/* Step numbers */}
            <div className="mb-2 flex items-center gap-2">
              <div className="w-28 shrink-0" />
              <div className="w-20 shrink-0" />
              <div className="w-12 shrink-0" />
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`flex-1 text-center font-mono text-[9px] ${i === currentStep ? "text-primary" : "text-muted-foreground/50"}`}>
                    {i % 4 === 0 ? i + 1 : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Track rows */}
            <div className="rounded-2xl border border-border/40 bg-background/30 p-3">
              {tracks.map((track) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  currentStep={currentStep}
                  onToggleStep={toggleStep}
                  onVolume={setVolume}
                  onMute={toggleMute}
                  onRootNote={setRootNote}
                />
              ))}
            </div>

            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Click cells to toggle beats · Spacebar to play/stop · 16-step sequencer
            </p>
          </div>
        </div>

        {/* Saved projects sidebar */}
        {projects.length > 0 && (
          <div className="hidden w-64 shrink-0 border-l border-border/40 overflow-y-auto lg:block">
            <div className="p-4">
              <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Saved Projects</h3>
              <div className="space-y-1.5">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => loadProject(proj)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${savedId === proj.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/70"}`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm text-foreground/90">{proj.name}</p>
                      <p className="font-mono text-[10px] text-muted-foreground">{proj.bpm} BPM</p>
                    </div>
                    <Download className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}