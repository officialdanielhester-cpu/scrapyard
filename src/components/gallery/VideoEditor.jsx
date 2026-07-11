import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Upload, Type, Download, Loader2, Film } from "lucide-react";
import EditorTimeline from "@/components/gallery/EditorTimeline";
import EditorProperties from "@/components/gallery/EditorProperties";
import MobileBackHeader from "@/components/MobileBackHeader";

const newId = () => `c-${Math.random().toString(36).slice(2, 9)}`;
const fmt = (s) => {
  if (!isFinite(s)) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

// CapCut-style video editor: import media, arrange on a timeline, split/trim,
// add draggable text overlays, and render to a downloadable .webm in real time.
export default function VideoEditor() {
  const [clips, setClips] = useState([]);
  const [texts, setTexts] = useState([]);
  const [selectedClipId, setSelectedClipId] = useState(null);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMsg, setExportMsg] = useState(null);
  const [previewW, setPreviewW] = useState(640);

  const videoRef = useRef(null);
  const imgRef = useRef(null);
  const previewRef = useRef(null);
  const playRef = useRef({ t: 0 });
  const playingRef = useRef(false);
  const audioRef = useRef(null);

  useEffect(() => { playingRef.current = playing; }, [playing]);

  const clipStarts = useMemo(() => {
    const arr = []; let acc = 0;
    for (const c of clips) { arr.push(acc); acc += c.dur; }
    return arr;
  }, [clips]);
  const totalDur = clips.length ? clipStarts[clips.length - 1] + clips[clips.length - 1].dur : 0;

  const clipIndexAt = useCallback((t) => {
    for (let i = 0; i < clips.length; i++) {
      if (t < clipStarts[i] + clips[i].dur - 1e-3) return i;
    }
    return clips.length - 1;
  }, [clips, clipStarts]);

  const currentIdx = clipIndexAt(currentTime);
  const currentClip = clips[currentIdx];
  const selectedClip = clips.find((c) => c.id === selectedClipId) || null;
  const selectedText = texts.find((t) => t.id === selectedTextId) || null;

  useEffect(() => { playRef.current.t = currentTime; }, [currentTime]);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setPreviewW(el.clientWidth));
    ro.observe(el);
    setPreviewW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Keep the <video> element synced to the current clip + playhead.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!currentClip || currentClip.type !== "video") { if (!v.paused) v.pause(); return; }
    if (v.src !== currentClip.url) v.src = currentClip.url;
    if (playing) {
      if (v.paused) v.play().catch(() => {});
    } else {
      const target = currentClip.offset + Math.max(0, currentTime - clipStarts[currentIdx]);
      if (Math.abs(v.currentTime - target) > 0.15) { try { v.currentTime = target; } catch {} }
      if (!v.paused) v.pause();
    }
  }, [currentTime, playing, currentClip, currentIdx, clipStarts]);

  // Master playback clock.
  useEffect(() => {
    if (!playing) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      const t = playRef.current.t;
      const idx = clipIndexAt(t);
      const clip = clips[idx];
      if (!clip) { setPlaying(false); return; }
      const cs = clipStarts[idx];
      const clipEnd = cs + clip.dur;
      if (clip.type === "image") {
        let nt = t + dt;
        if (nt >= clipEnd) {
          if (idx + 1 < clips.length) { nt = clipEnd; }
          else { playRef.current.t = totalDur; setCurrentTime(totalDur); setPlaying(false); return; }
        }
        playRef.current.t = nt; setCurrentTime(nt);
      } else {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && !v.paused) {
          const local = v.currentTime - clip.offset;
          if (v.ended || local >= clip.dur - 0.02) {
            if (idx + 1 < clips.length) { playRef.current.t = clipEnd; setCurrentTime(clipEnd); }
            else { playRef.current.t = totalDur; setCurrentTime(totalDur); setPlaying(false); return; }
          } else {
            playRef.current.t = cs + local; setCurrentTime(cs + local);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, clips, clipStarts, totalDur, clipIndexAt]);

  const togglePlay = () => {
    if (totalDur <= 0) return;
    setSelectedTextId(null);
    if (!playing && currentTime >= totalDur - 0.05) { playRef.current.t = 0; setCurrentTime(0); }
    setPlaying((p) => !p);
  };

  const onScrub = (e) => {
    const t = Number(e.target.value);
    setPlaying(false);
    playRef.current.t = t;
    setCurrentTime(t);
  };

  const onFile = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      if (file.type.startsWith("video/")) {
        const v = document.createElement("video");
        v.preload = "metadata"; v.src = url;
        v.onloadedmetadata = () => {
          const d = isFinite(v.duration) && v.duration > 0 ? v.duration : 5;
          setClips((p) => [...p, { id: newId(), type: "video", url, name: file.name, dur: d, offset: 0 }]);
        };
      } else if (file.type.startsWith("image/")) {
        setClips((p) => [...p, { id: newId(), type: "image", url, name: file.name, dur: 5 }]);
      }
    });
    e.target.value = "";
  };

  const addText = () => {
    const t = { id: `t-${Math.random().toString(36).slice(2, 8)}`, content: "Your text", x: 0.5, y: 0.5, color: "#ffffff", size: 6 };
    setTexts((p) => [...p, t]);
    setSelectedTextId(t.id);
    setSelectedClipId(null);
  };

  const onTextPointerDown = (e, id) => {
    e.stopPropagation();
    setSelectedTextId(id);
    setSelectedClipId(null);
    const rect = previewRef.current.getBoundingClientRect();
    const move = (ev) => {
      const x = (ev.clientX - rect.left) / rect.width;
      const y = (ev.clientY - rect.top) / rect.height;
      setTexts((p) => p.map((tx) => (tx.id === id ? { ...tx, x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) } : tx)));
    };
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const splitAtPlayhead = () => {
    if (!selectedClip) return;
    const idx = clips.findIndex((c) => c.id === selectedClip.id);
    if (idx < 0) return;
    const local = currentTime - clipStarts[idx];
    if (local <= 0.1 || local >= selectedClip.dur - 0.1) return;
    const a = { ...selectedClip, dur: local };
    const b = { ...selectedClip, id: newId(), name: `${selectedClip.name} 2`, offset: (selectedClip.offset || 0) + local, dur: selectedClip.dur - local };
    const next = [...clips];
    next.splice(idx, 1, a, b);
    setClips(next);
    setSelectedClipId(b.id);
  };

  const deleteSelected = () => {
    if (selectedClip) {
      const idx = clips.findIndex((c) => c.id === selectedClip.id);
      const next = clips.filter((c) => c.id !== selectedClip.id);
      setClips(next);
      setSelectedClipId(next[idx] ? next[idx].id : next[idx - 1]?.id || null);
      const newTotal = next.reduce((a, c) => a + c.dur, 0);
      if (currentTime > newTotal) { playRef.current.t = newTotal; setCurrentTime(newTotal); }
    } else if (selectedText) {
      setTexts((p) => p.filter((t) => t.id !== selectedText.id));
      setSelectedTextId(null);
    }
  };

  const moveClip = (dir) => {
    if (!selectedClip) return;
    const idx = clips.findIndex((c) => c.id === selectedClip.id);
    const j = idx + dir;
    if (j < 0 || j >= clips.length) return;
    const next = [...clips];
    [next[idx], next[j]] = [next[j], next[idx]];
    setClips(next);
  };

  const ensureExportAudio = () => {
    if (audioRef.current !== null) return audioRef.current;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const dest = audioCtx.createMediaStreamDestination();
      const srcNode = audioCtx.createMediaElementSource(videoRef.current);
      srcNode.connect(audioCtx.destination);
      audioRef.current = { audioCtx, dest, srcNode };
    } catch { audioRef.current = null; }
    return audioRef.current;
  };

  const drawCover = (ctx, media, W, H) => {
    const vw = media.videoWidth || media.naturalWidth || media.width;
    const vh = media.videoHeight || media.naturalHeight || media.height;
    if (!vw || !vh) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); return; }
    const scale = Math.max(W / vw, H / vh);
    const dw = vw * scale, dh = vh * scale;
    ctx.drawImage(media, (W - dw) / 2, (H - dh) / 2, dw, dh);
  };

  const handleExport = async () => {
    if (!clips.length || exporting) return;
    if (typeof MediaRecorder === "undefined" || !HTMLCanvasElement.prototype.captureStream) {
      setExportMsg("Export isn't supported in this browser.");
      return;
    }
    setExporting(true); setExportProgress(0); setExportMsg(null);
    setSelectedTextId(null);

    const W = 1280, H = 720;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");

    const g = ensureExportAudio();
    if (g) {
      if (g.audioCtx.state === "suspended") g.audioCtx.resume();
      try { g.srcNode.connect(g.dest); } catch {}
    }
    const cs = canvas.captureStream(30);
    const tracks = [...cs.getVideoTracks()];
    if (g) tracks.push(...g.dest.stream.getAudioTracks());
    const stream = new MediaStream(tracks);

    let rec;
    try { rec = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9,opus" }); }
    catch { try { rec = new MediaRecorder(stream, { mimeType: "video/webm" }); } catch { rec = new MediaRecorder(stream); } }
    const chunks = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    const stopped = new Promise((res) => { rec.onstop = res; });
    rec.start(100);

    playRef.current.t = 0; setCurrentTime(0);
    setPlaying(true);

    await new Promise((resolve) => {
      const draw = () => {
        const t = playRef.current.t;
        const idx = clipIndexAt(t);
        const clip = clips[idx];
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        if (clip) {
          if (clip.type === "video" && videoRef.current && videoRef.current.readyState >= 2) drawCover(ctx, videoRef.current, W, H);
          else if (clip.type === "image" && imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth) drawCover(ctx, imgRef.current, W, H);
          texts.forEach((tx) => {
            const fs = Math.max(10, (tx.size / 100) * W);
            ctx.font = `bold ${fs}px sans-serif`;
            ctx.fillStyle = tx.color;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = fs * 0.12;
            ctx.fillText(tx.content, tx.x * W, tx.y * H);
            ctx.shadowBlur = 0;
          });
        }
        setExportProgress(Math.min(1, t / Math.max(0.001, totalDur)));
        if (t >= totalDur - 0.05 || !playingRef.current) { resolve(); return; }
        requestAnimationFrame(draw);
      };
      requestAnimationFrame(draw);
    });

    rec.stop();
    await stopped;
    if (g) { try { g.srcNode.disconnect(g.dest); } catch {} }
    setPlaying(false);
    setExporting(false);

    const blob = new Blob(chunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "scrapyard-export.webm"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    setExportMsg("Exported — check your downloads.");
  };

  return (
    <div className="min-h-screen pb-10">
      <MobileBackHeader title="Video Editor" subtitle="Import · Cut · Caption · Export" />
      <header className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between md:px-12">
        <div className="hidden md:block">
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Video Editor</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Import · Cut · Caption · Export</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary">
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} /> Add Media
            <input type="file" accept="video/*,image/*" multiple onChange={onFile} className="hidden" />
          </label>
          <button onClick={addText} className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-border/60 px-4 py-2 text-xs font-medium transition-colors hover:border-primary hover:text-primary">
            <Type className="h-3.5 w-3.5" strokeWidth={1.5} /> Add Text
          </button>
          <button onClick={handleExport} disabled={exporting || clips.length === 0} className="flex min-h-[40px] items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50">
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" strokeWidth={1.5} />}
            {exporting ? `Rendering ${Math.round(exportProgress * 100)}%` : "Export"}
          </button>
        </div>
      </header>

      <div className="px-6 md:px-12">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <div ref={previewRef} className="relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border border-border/50 bg-black">
              <video ref={videoRef} className="absolute inset-0 h-full w-full object-contain" style={{ display: currentClip?.type === "video" ? "block" : "none" }} playsInline />
              <img ref={imgRef} src={currentClip?.type === "image" ? currentClip.url : ""} className="absolute inset-0 h-full w-full object-contain" style={{ display: currentClip?.type === "image" ? "block" : "none" }} alt="" />
              {texts.map((tx) => (
                <div
                  key={tx.id}
                  onPointerDown={(e) => onTextPointerDown(e, tx.id)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap select-none ${selectedTextId === tx.id ? "ring-2 ring-primary" : ""}`}
                  style={{ left: `${tx.x * 100}%`, top: `${tx.y * 100}%`, color: tx.color, fontSize: `${(tx.size / 100) * previewW}px`, fontWeight: 700, textShadow: "0 1px 4px rgba(0,0,0,0.65)" }}
                >
                  {tx.content}
                </div>
              ))}
              {clips.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                  <Film className="h-8 w-8 opacity-40" strokeWidth={1} />
                  <p className="mt-2 text-sm">Import video or images to start</p>
                </div>
              )}
              {exporting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-primary">Rendering {Math.round(exportProgress * 100)}%</p>
                  </div>
                </div>
              )}
            </div>

            <EditorTimeline
              clips={clips}
              selectedId={selectedClipId}
              currentTime={currentTime}
              totalDur={totalDur}
              playing={playing}
              onSelect={(id) => { setSelectedClipId(id); setSelectedTextId(null); }}
              onScrub={onScrub}
              onSplit={splitAtPlayhead}
              onDelete={deleteSelected}
              onMoveLeft={() => moveClip(-1)}
              onMoveRight={() => moveClip(1)}
              onTogglePlay={togglePlay}
            />
          </div>

          <EditorProperties
            clip={selectedClip}
            text={selectedText}
            onUpdateClip={(patch) => setClips((p) => p.map((c) => (c.id === selectedClip.id ? { ...c, ...patch } : c)))}
            onDeleteClip={deleteSelected}
            onUpdateText={(patch) => setTexts((p) => p.map((t) => (t.id === selectedText.id ? { ...t, ...patch } : t)))}
            onDeleteText={deleteSelected}
          />
        </div>

        {exportMsg && <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{exportMsg}</p>}
        <p className="mt-4 hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 md:block">
          Tip: use the arrows to reorder · scissors split at the playhead · drag text to position · Export renders in real time
        </p>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 md:hidden">
          Tip: use the arrows to reorder · scissors split at the playhead · touch drag text to position · Export renders in real time
        </p>
      </div>
    </div>
  );
}