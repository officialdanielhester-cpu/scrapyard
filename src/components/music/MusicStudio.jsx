import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import MusicEngine from "@/components/music/audioEngine";
import Timeline from "@/components/music/Timeline";
import TransportBar from "@/components/music/TransportBar";
import Mixer from "@/components/music/Mixer";
import EffectsRack from "@/components/music/EffectsRack";
import SampleLibrary from "@/components/music/SampleLibrary";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const COLORS = ["#a855f7", "#8b5cf6", "#6366f1", "#ec4899", "#f97316", "#10b981", "#06b6d4", "#eab308"];
const uid = (p) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

function emptyProject() {
  return {
    name: "Untitled Project", bpm: 120, duration: 60, masterVolume: 0.8, loop: true,
    tracks: [{ id: uid("t"), name: "Track 1", color: COLORS[0], height: 56, volume: 0.8, pan: 0, muted: false, solo: false, eq: "none", reverb: false }],
    clips: [],
  };
}

export default function MusicStudio() {
  const [project, setProject] = useState(emptyProject);
  const [savedId, setSavedId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(80);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [selectedTrackId, setSelectedTrackId] = useState(null);
  const [masterLevel, setMasterLevel] = useState(0);
  const [undo, setUndo] = useState([]);
  const [redo, setRedo] = useState([]);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const engineRef = useRef(null);
  const recRef = useRef(null);
  const recChunksRef = useRef([]);
  const projRef = useRef(project); projRef.current = project;

  useEffect(() => {
    const engine = new MusicEngine();
    engineRef.current = engine;
    engine.onTime = (t) => setCurrentTime(t);
    engine.onEnd = () => setPlaying(false);
    (async () => { try { const list = await base44.entities.MusicProject.list("-updated_date", 30); setProjects(list); } catch {} })();
    return () => { engine.stop(); };
  }, []);

  useEffect(() => { const e = engineRef.current; if (e) { e.setProject(project); e.setLoop(project.loop); } }, [project]);

  useEffect(() => {
    let raf, count = 0;
    const tick = () => { const e = engineRef.current; if (e && count++ % 2 === 0) setMasterLevel(e.getMasterLevel()); raf = requestAnimationFrame(tick); };
    tick();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!savedId) return;
    const t = setTimeout(async () => { try { await base44.entities.MusicProject.update(savedId, { ...project }); } catch {} }, 4000);
    return () => clearTimeout(t);
  }, [project, savedId]);

  const snapshot = useCallback(() => setUndo((u) => [...u.slice(-49), JSON.parse(JSON.stringify(projRef.current))]), []);
  const mutate = useCallback((fn) => { snapshot(); setProject((p) => fn(p)); setRedo([]); }, [snapshot]);

  const handleUndo = () => { if (!undo.length) return; setUndo((u) => { const prev = u[u.length - 1]; setRedo((r) => [...r, JSON.parse(JSON.stringify(projRef.current))]); setProject(prev); return u.slice(0, -1); }); };
  const handleRedo = () => { if (!redo.length) return; setRedo((r) => { const next = r[r.length - 1]; setUndo((u) => [...u, JSON.parse(JSON.stringify(projRef.current))]); setProject(next); return r.slice(0, -1); }); };

  const handlePlay = async () => { const e = engineRef.current; if (!e) return; if (playing) { e.pause(); setPlaying(false); } else { await e.play(currentTime); setPlaying(true); } };
  const handleStop = () => { engineRef.current?.stop(); setPlaying(false); setCurrentTime(0); };
  const handleToggleLoop = () => setProject((p) => ({ ...p, loop: !p.loop }));
  const handleSeek = (t) => engineRef.current?.seek(t);
  const handleSetBpm = (bpm) => mutate((p) => ({ ...p, bpm }));
  const handleSetProjectName = (name) => setProject((p) => ({ ...p, name }));
  const handleSetMasterVolume = (v) => { setProject((p) => ({ ...p, masterVolume: v })); engineRef.current?.setMasterVolume(v); };

  const addTrack = () => mutate((p) => ({ ...p, tracks: [...p.tracks, { id: uid("t"), name: `Track ${p.tracks.length + 1}`, color: COLORS[p.tracks.length % COLORS.length], height: 56, volume: 0.8, pan: 0, muted: false, solo: false, eq: "none", reverb: false }] }));
  const deleteTrack = (id) => mutate((p) => ({ ...p, tracks: p.tracks.filter((t) => t.id !== id), clips: p.clips.filter((c) => c.trackId !== id) }));
  const setTrackProp = (id, patch) => { setProject((p) => ({ ...p, tracks: p.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })); engineRef.current?.setTrackProp(id, patch); };

  const addClip = (sampleKey) => {
    const e = engineRef.current;
    const meta = e.addBuiltin(sampleKey.replace("builtin:", ""));
    const trackId = selectedTrackId || project.tracks[0]?.id;
    if (!trackId) return;
    const start = currentTime;
    mutate((p) => ({ ...p, clips: [...p.clips, { id: uid("c"), trackId, name: meta.name, start, duration: meta.duration, sourceStart: 0, sampleUrl: sampleKey }] }));
  };
  const importFile = async (file) => {
    const e = engineRef.current;
    const meta = await e.addFileSample(file);
    if (!meta) return;
    const trackId = selectedTrackId || project.tracks[0]?.id;
    if (!trackId) return;
    mutate((p) => ({ ...p, clips: [...p.clips, { id: uid("c"), trackId, name: meta.name, start: currentTime, duration: Math.min(meta.duration, p.duration), sourceStart: 0, sampleUrl: meta.key }] }));
  };
  const moveClip = (id, patch) => setProject((p) => ({ ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const trimClip = (id, patch) => setProject((p) => ({ ...p, clips: p.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const splitClip = () => {
    if (!selectedClipId) return;
    const c = project.clips.find((x) => x.id === selectedClipId); if (!c) return;
    if (currentTime <= c.start || currentTime >= c.start + c.duration) return;
    const off = currentTime - c.start;
    mutate((p) => ({ ...p, clips: [...p.clips.filter((x) => x.id !== c.id), { ...c, duration: off }, { ...c, id: uid("c"), start: currentTime, duration: c.duration - off, sourceStart: (c.sourceStart || 0) + off }] }));
  };
  const deleteClip = () => mutate((p) => ({ ...p, clips: p.clips.filter((c) => c.id !== selectedClipId) }));

  const handleRecord = async () => {
    const e = engineRef.current; if (!e) return;
    try {
      const stream = await e.startRecording();
      let rec; try { rec = new MediaRecorder(stream, { mimeType: "audio/webm" }); } catch { rec = new MediaRecorder(stream); }
      recChunksRef.current = [];
      rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) recChunksRef.current.push(ev.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunksRef.current, { type: "audio/webm" });
        const meta = await e.addBlobSample(blob, "Recording");
        if (!meta) return;
        const trackId = selectedTrackId || projRef.current.tracks[0]?.id; if (!trackId) return;
        mutate((p) => ({ ...p, clips: [...p.clips, { id: uid("c"), trackId, name: meta.name, start: currentTime, duration: Math.min(meta.duration, p.duration), sourceStart: 0, sampleUrl: meta.key }] }));
      };
      rec.start(100); recRef.current = rec; setRecording(true);
    } catch {}
  };
  const stopRecord = () => { const r = recRef.current; if (r && r.state !== "inactive") r.stop(); setRecording(false); };

  const handleSave = async () => {
    const e = engineRef.current; setSaving(true);
    try {
      const clips = [];
      for (const c of project.clips) {
        if (c.sampleUrl && c.sampleUrl.startsWith("blob:")) {
          try { const res = await fetch(c.sampleUrl); const blob = await res.blob(); const { file_url } = await base44.integrations.Core.UploadFile({ file: blob }); clips.push({ ...c, sampleUrl: file_url }); }
          catch { clips.push(c); }
        } else clips.push(c);
      }
      const payload = { ...project, clips };
      if (savedId) { await base44.entities.MusicProject.update(savedId, payload); }
      else { const created = await base44.entities.MusicProject.create(payload); setSavedId(created.id); }
      setProject(payload);
      const list = await base44.entities.MusicProject.list("-updated_date", 30); setProjects(list);
    } catch {} finally { setSaving(false); }
  };
  const loadProject = async (proj) => {
    engineRef.current?.stop(); setPlaying(false); setCurrentTime(0);
    const loaded = { ...emptyProject(), ...proj, tracks: proj.tracks?.length ? proj.tracks : emptyProject().tracks, clips: proj.clips || [] };
    setProject(loaded); setSavedId(proj.id);
    await engineRef.current?.loadProjectSamples(loaded.clips);
  };
  const handleNew = () => { engineRef.current?.stop(); setPlaying(false); setCurrentTime(0); setProject(emptyProject()); setSavedId(null); };

  const selectedTrack = project.tracks.find((t) => t.id === selectedTrackId) || project.tracks[0];
  const zoomIn = () => setZoom((z) => Math.min(400, z * 1.3));
  const zoomOut = () => setZoom((z) => Math.max(20, z / 1.3));
  const fit = () => setZoom(Math.max(20, Math.min(400, 800 / (project.duration || 60))));

  return (
    <div className="flex h-screen flex-col">
      <TransportBar playing={playing} currentTime={currentTime} duration={project.duration} loop={project.loop} bpm={project.bpm} projectName={project.name}
        canUndo={undo.length > 0} canRedo={redo.length > 0} saving={saving}
        onPlay={handlePlay} onStop={handleStop} onToggleLoop={handleToggleLoop} onSetBpm={handleSetBpm} onSetProjectName={handleSetProjectName}
        onUndo={handleUndo} onRedo={handleRedo} onSave={handleSave} onOpen={() => setProjectsOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Timeline project={project} pxPerSec={zoom} currentTime={currentTime} selectedClipId={selectedClipId}
            onSelectClip={setSelectedClipId} onMoveClip={moveClip} onTrimClip={trimClip} onSplitClip={splitClip} onDeleteClip={deleteClip}
            onAddTrack={addTrack} onSeek={handleSeek} onZoomIn={zoomIn} onZoomOut={zoomOut} onFit={fit} onClipInteractionStart={snapshot} />
          <SampleLibrary onAddClip={addClip} onImportFile={importFile} recording={recording} onRecord={handleRecord} onStopRecord={stopRecord} />
        </div>
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l border-border/40 bg-background/30 p-3 lg:block">
          <Mixer project={project} selectedTrackId={selectedTrackId} masterLevel={masterLevel}
            onSelectTrack={setSelectedTrackId} onAddTrack={addTrack} onDeleteTrack={deleteTrack}
            onSetTrackProp={setTrackProp} onSetMasterVolume={handleSetMasterVolume} />
          <div className="mt-4 border-t border-border/40 pt-3">
            <EffectsRack track={selectedTrack} onChange={(patch) => selectedTrack && setTrackProp(selectedTrack.id, patch)} />
          </div>
        </aside>
      </div>

      <Sheet open={projectsOpen} onOpenChange={setProjectsOpen}>
        <SheetContent side="right" className="w-80 overflow-y-auto">
          <SheetHeader><SheetTitle>Projects</SheetTitle></SheetHeader>
          <div className="space-y-1.5 p-2">
            <button onClick={() => { handleNew(); setProjectsOpen(false); }} className="w-full rounded-lg border border-border/60 px-3 py-2 text-left text-sm hover:border-primary">+ New Project</button>
            {projects.map((p) => (
              <button key={p.id} onClick={() => { loadProject(p); setProjectsOpen(false); }} className={`w-full rounded-lg border px-3 py-2.5 text-left ${savedId === p.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border/70"}`}>
                <p className="truncate text-sm">{p.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{p.bpm} BPM · {p.tracks?.length || 0} tracks</p>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}