import React, { useState, useEffect, useRef, useCallback } from "react";
import { Download, Mic, Square, Upload } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import SoundEngine, { INSTRUMENTS, DEFAULT_BEAT } from "@/components/sound/SoundEngine";
import TrackRow from "@/components/sound/TrackRow";
import TransportBar from "@/components/sound/TransportBar";
import InstrumentKeyboard from "@/components/sound/InstrumentKeyboard";

const ADD_INSTRUMENTS = INSTRUMENTS.filter((i) => i.id !== "sample");

export default function SoundSection() {
  const [tracks, setTracks] = useState(DEFAULT_BEAT);
  const [bpm, setBpm] = useState(120);
  const [masterVolume, setMasterVolume] = useState(0.75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [projectName, setProjectName] = useState("Untitled Beat");
  const [savedId, setSavedId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const engineRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const sampleBlobsRef = useRef({});
  const importRef = useRef(null);

  useEffect(() => { engineRef.current = SoundEngine; }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await base44.entities.SoundProject.list("-updated_date", 20);
        setProjects(list);
      } catch (e) { /* ignore on first load */ }
    })();
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTracks(tracks);
      engineRef.current.setBpm(bpm);
    }
  }, [tracks, bpm]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.setMasterVolume(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
    if (engineRef.current) engineRef.current.onStep = (step) => setCurrentStep(step);
  }, []);

  const handlePlay = useCallback(() => {
    if (!engineRef.current) return;
    if (isPlaying) { engineRef.current.stop(); setIsPlaying(false); setCurrentStep(-1); }
    else { engineRef.current.play(); setIsPlaying(true); }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
  }, []);

  const toggleStep = (trackId, stepIdx) => {
    setTracks((prev) => prev.map((t) => {
      if (t.id !== trackId) return t;
      const steps = [...t.steps];
      steps[stepIdx] = steps[stepIdx] ? 0 : 1;
      return { ...t, steps };
    }));
  };

  const setVolume = (trackId, vol) => setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, volume: vol } : t)));
  const setPan = (trackId, pan) => setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, pan } : t)));
  const toggleMute = (trackId) => setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)));
  const toggleSolo = (trackId) => setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, solo: !t.solo } : t)));
  const setRootNote = (trackId, note) => setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, rootNote: note } : t)));
  const renameTrack = (trackId, name) => setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, name } : t)));
  const previewSample = (trackId) => engineRef.current?.playSample(trackId, 0.85);

  const addTrack = (instrumentId) => {
    const inst = INSTRUMENTS.find((i) => i.id === instrumentId);
    if (!inst) return;
    const newId = `${inst.id}-${Date.now()}`;
    setTracks((prev) => [...prev, {
      id: newId, name: inst.name, instrument: inst.id,
      volume: 0.7, pan: 0, muted: false, solo: false, rootNote: 0, steps: Array(16).fill(0),
    }]);
  };

  const removeTrack = (trackId) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    delete sampleBlobsRef.current[trackId];
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    setTracks((prev) => {
      const reordered = Array.from(prev);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);
      return reordered;
    });
  };

  const handleNew = () => {
    if (engineRef.current) engineRef.current.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
    setTracks(ADD_INSTRUMENTS.map((inst) => ({
      id: inst.id, name: inst.name, instrument: inst.id,
      volume: 0.7, pan: 0, muted: false, solo: false, rootNote: 0, steps: Array(16).fill(0),
    })));
    setProjectName("Untitled Beat");
    setSavedId(null);
  };

  const handleRandomize = () => {
    setTracks((prev) => prev.map((t) => ({ ...t, steps: t.steps.map(() => (Math.random() < 0.25 ? 1 : 0)) })));
  };

  const handleClear = () => {
    setTracks((prev) => prev.map((t) => ({ ...t, steps: Array(16).fill(0) })));
  };

  // ---- Sample recording & import ----
  const addSampleTrack = async (blob, name) => {
    const sampleId = `sample-${Date.now()}`;
    const url = URL.createObjectURL(blob);
    sampleBlobsRef.current[sampleId] = blob;
    await engineRef.current.loadSample(sampleId, url);
    setTracks((prev) => [...prev, {
      id: sampleId, name: (name || "Sample").slice(0, 28), instrument: "sample",
      volume: 0.8, pan: 0, muted: false, solo: false, rootNote: 0,
      steps: Array(16).fill(0), sampleUrl: url,
    }]);
  };

  const startRecord = () => {
    const engine = engineRef.current;
    if (!engine) return;
    const stream = engine.getRecordStream();
    let rec;
    try { rec = new MediaRecorder(stream, { mimeType: "audio/webm" }); }
    catch { try { rec = new MediaRecorder(stream); } catch { return; } }
    recordedChunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) recordedChunksRef.current.push(e.data); };
    rec.onstop = () => {
      if (recordedChunksRef.current.length) {
        const blob = new Blob(recordedChunksRef.current, { type: "audio/webm" });
        addSampleTrack(blob, "Recording");
      }
    };
    rec.start(100);
    mediaRecorderRef.current = rec;
    setRecording(true);
  };

  const stopRecord = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    setRecording(false);
  };

  const onImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addSampleTrack(file, file.name.replace(/\.[^.]+$/, ""));
    e.target.value = "";
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const tracksToSave = [];
      for (const t of tracks) {
        if (t.instrument === "sample" && t.sampleUrl && t.sampleUrl.startsWith("blob:")) {
          const blob = sampleBlobsRef.current[t.id];
          if (blob) {
            const { file_url } = await base44.integrations.Core.UploadFile({ file: blob });
            tracksToSave.push({ ...t, sampleUrl: file_url });
            continue;
          }
        }
        tracksToSave.push(t);
      }
      const payload = { name: projectName, bpm, masterVolume, tracks: tracksToSave };
      if (savedId) {
        await base44.entities.SoundProject.update(savedId, payload);
      } else {
        const created = await base44.entities.SoundProject.create(payload);
        setSavedId(created.id);
      }
      setTracks(tracksToSave);
      const list = await base44.entities.SoundProject.list("-updated_date", 20);
      setProjects(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (proj) => {
    if (engineRef.current) engineRef.current.stop();
    setIsPlaying(false);
    setCurrentStep(-1);
    const newTracks = proj.tracks?.length ? proj.tracks : DEFAULT_BEAT;
    setTracks(newTracks);
    setBpm(proj.bpm || 120);
    setMasterVolume(proj.masterVolume ?? 0.75);
    setProjectName(proj.name);
    setSavedId(proj.id);
    for (const t of newTracks) {
      if (t.instrument === "sample" && t.sampleUrl) {
        await engineRef.current.loadSample(t.id, t.sampleUrl);
      }
    }
  };

  return (
    <div className="flex h-full flex-col">
      <TransportBar
        isPlaying={isPlaying}
        onPlay={handlePlay}
        onStop={handleStop}
        bpm={bpm}
        setBpm={setBpm}
        currentStep={currentStep}
        masterVolume={masterVolume}
        setMasterVolume={setMasterVolume}
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
        {/* Sequencer + live play */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:px-12">
          <div className="mx-auto max-w-4xl">
            {/* Step numbers */}
            <div className="mb-2 flex items-center gap-2">
              <div className="w-72 shrink-0" />
              <div className="flex flex-1 gap-1 px-2">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className={`flex-1 text-center font-mono text-[9px] ${i === currentStep ? "text-primary" : "text-muted-foreground/50"}`}>
                    {i % 4 === 0 ? i + 1 : ""}
                  </div>
                ))}
              </div>
            </div>

            {/* Track lanes — drag to reorder */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="tracks">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="overflow-hidden rounded-2xl border border-border/40 bg-background/30"
                  >
                    {tracks.map((track, index) => (
                      <Draggable key={track.id} draggableId={track.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`w-full ${snapshot.isDragging ? "shadow-2xl ring-1 ring-primary/30 z-50" : ""}`}
                          >
                            <TrackRow
                              track={track}
                              currentStep={currentStep}
                              dragHandleProps={provided.dragHandleProps}
                              onToggleStep={toggleStep}
                              onVolume={setVolume}
                              onMute={toggleMute}
                              onSolo={toggleSolo}
                              onPan={setPan}
                              onRootNote={setRootNote}
                              onRename={renameTrack}
                              onRemove={removeTrack}
                              onPreview={previewSample}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Drag tracks to reorder · Click cells to toggle beats · S = Solo · M = Mute · {ADD_INSTRUMENTS.length} instruments
            </p>

            {/* Live play + recording panel */}
            <div className="mt-6 space-y-4">
              <InstrumentKeyboard />

              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border/40 bg-background/40 p-4">
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Samples</span>
                </div>
                {recording ? (
                  <button
                    onClick={stopRecord}
                    className="flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 font-mono text-xs uppercase text-destructive-foreground transition-opacity hover:opacity-90"
                  >
                    <Square className="h-4 w-4" strokeWidth={2} /> Stop & Add
                  </button>
                ) : (
                  <button
                    onClick={startRecord}
                    className="flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary"
                  >
                    <Mic className="h-4 w-4" strokeWidth={1.5} /> Record
                  </button>
                )}
                <button
                  onClick={() => importRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-border/60 px-4 py-2 font-mono text-xs uppercase text-foreground/80 transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="h-4 w-4" strokeWidth={1.5} /> Import
                </button>
                <input ref={importRef} type="file" accept="audio/*" onChange={onImport} className="hidden" />
                {recording && (
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase text-destructive">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-destructive" /> Recording live play…
                  </span>
                )}
                <p className="ml-auto hidden font-mono text-[10px] text-muted-foreground/60 md:block">
                  Record captures anything you play · Import loads any audio file → new sample track
                </p>
              </div>
            </div>
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