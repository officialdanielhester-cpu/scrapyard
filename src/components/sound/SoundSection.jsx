import React, { useState, useEffect, useRef, useCallback } from "react";
import { Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import SoundEngine, { INSTRUMENTS, DEFAULT_BEAT } from "@/components/sound/SoundEngine";
import TrackRow from "@/components/sound/TrackRow";
import SoundToolbar from "@/components/sound/SoundToolbar";

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

  const addTrack = (instrumentId) => {
    const inst = INSTRUMENTS.find((i) => i.id === instrumentId);
    if (!inst) return;
    const newId = `${inst.id}-${Date.now()}`;
    setTracks((prev) => [...prev, {
      id: newId, name: inst.name, instrument: inst.id,
      volume: 0.7, muted: false, rootNote: 0, steps: Array(16).fill(0),
    }]);
  };

  const removeTrack = (trackId) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
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
      <header className="border-b border-border/40 px-6 py-3 md:px-12">
        <h1 className="font-heading text-lg font-extrabold tracking-tight">
          Sound <span className="font-mono text-[11px] font-normal uppercase tracking-[0.2em] text-muted-foreground">Beat Maker Studio</span>
        </h1>
      </header>
      <SoundToolbar
        isPlaying={isPlaying}
        onPlay={handlePlay}
        bpm={bpm}
        setBpm={setBpm}
        onNew={handleNew}
        onSave={handleSave}
        onClear={handleClear}
        onRandom={handleRandomize}
        onAddTrack={addTrack}
        projectName={projectName}
        setProjectName={setProjectName}
        loading={loading}
      />

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
                  onRemove={removeTrack}
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