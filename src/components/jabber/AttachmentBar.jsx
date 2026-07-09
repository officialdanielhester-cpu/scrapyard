import React, { useRef, useState } from "react";
import { Mic, Paperclip, Video, Link as LinkIcon, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const rid = () => Math.random().toString(36).slice(2);
const KIND_ICON = { voice: Mic, image: Paperclip, file: Paperclip, video: Video, link: LinkIcon };

// Lets the user attach voice (transcribed), files/images (extracted), short
// videos (a frame is grabbed), and links — each turned into context Jabber can read.
export default function AttachmentBar({ attachments, setAttachments }) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState("");
  const [err, setErr] = useState(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const addAtt = (att) => setAttachments((prev) => [...prev, att]);
  const removeAtt = (id) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  const startRec = async () => {
    setErr(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setProcessing("Transcribing voice…");
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const { file_url } = await base44.integrations.Core.UploadFile({ file: new File([blob], "voice.webm", { type: "audio/webm" }) });
          const transcript = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
          addAtt({ id: rid(), kind: "voice", label: "Voice message", text: `Voice message transcript: "${transcript}"`, fileUrls: [] });
        } catch (e) {
          setErr("Couldn't transcribe voice — try again.");
        } finally {
          setProcessing("");
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch (e) {
      setErr("Microphone access denied.");
    }
  };
  const stopRec = () => { recorderRef.current?.stop(); setRecording(false); };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setProcessing("Reading file…");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (file.type.startsWith("image/")) {
        addAtt({ id: rid(), kind: "image", label: file.name, text: `Shared image: ${file.name}`, fileUrls: [file_url] });
      } else {
        const schema = { type: "object", properties: { summary: { type: "string" }, content: { type: "string" } }, required: ["summary"] };
        const res = await base44.integrations.Core.ExtractDataFromUploadedFile({ file_url, json_schema: schema });
        const out = res?.output;
        const summary = out && typeof out === "object" && !Array.isArray(out) ? (out.summary || out.content || JSON.stringify(out)) : typeof out === "string" ? out : "Could not extract content.";
        addAtt({ id: rid(), kind: "file", label: file.name, text: `Shared file "${file.name}": ${summary}`, fileUrls: [] });
      }
    } catch (e2) {
      addAtt({ id: rid(), kind: "file", label: file.name, text: `Shared file: ${file.name} (could not read contents)`, fileUrls: [] });
    } finally {
      setProcessing("");
    }
  };

  const makeThumb = (url) => new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.src = url; v.muted = true; v.playsInline = true;
    v.onloadeddata = () => { v.currentTime = Math.min(1, (v.duration || 1) / 2); };
    v.onseeked = async () => {
      try {
        const c = document.createElement("canvas");
        c.width = v.videoWidth || 320; c.height = v.videoHeight || 180;
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(async (blob) => {
          if (!blob) return reject(new Error("no frame"));
          const { file_url } = await base44.integrations.Core.UploadFile({ file: new File([blob], "frame.jpg", { type: "image/jpeg" }) });
          resolve(file_url);
        }, "image/jpeg", 0.8);
      } catch (e) { reject(e); }
    };
    v.onerror = () => reject(new Error("video load error"));
  });

  const onVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setProcessing("Uploading video…");
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      let thumbUrl = null;
      try { thumbUrl = await makeThumb(file_url); } catch {}
      addAtt({ id: rid(), kind: "video", label: file.name, text: `Shared short video: ${file.name}${thumbUrl ? " (a frame is attached for reference)." : ""}`, fileUrls: thumbUrl ? [thumbUrl] : [] });
    } catch (e2) {
      setErr("Couldn't upload video — try again.");
    } finally {
      setProcessing("");
    }
  };

  const submitLink = () => {
    const url = linkInput.trim();
    if (!url) { setLinkOpen(false); return; }
    addAtt({ id: rid(), kind: "link", label: url, text: `Shared link: ${url}`, fileUrls: [] });
    setLinkInput(""); setLinkOpen(false);
  };

  const voiceBusy = processing === "Transcribing voice…";

  return (
    <div className="mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={recording ? stopRec : startRec}
          title="Voice message"
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${recording ? "border-destructive text-destructive animate-pulse" : "border-border/60 text-muted-foreground hover:border-primary hover:text-primary"}`}
        >
          {voiceBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
          {recording ? "Stop" : "Voice"}
        </button>
        <button onClick={() => fileInputRef.current?.click()} title="Attach file" className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Paperclip className="h-3.5 w-3.5" /> File
        </button>
        <button onClick={() => videoInputRef.current?.click()} title="Attach short video" className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <Video className="h-3.5 w-3.5" /> Video
        </button>
        <button onClick={() => setLinkOpen((o) => !o)} title="Attach link" className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary">
          <LinkIcon className="h-3.5 w-3.5" /> Link
        </button>
        {processing && !voiceBusy && (
          <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> {processing}
          </span>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf,text/plain,text/csv,application/json,.csv,.json,.xlsx,.doc,.docx,.html" className="hidden" onChange={onFile} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={onVideo} />
      </div>

      {linkOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input
            autoFocus
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitLink(); } }}
            placeholder="Paste a URL…"
            className="flex-1 rounded-md border border-border/60 bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <button onClick={submitLink} className="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">Add</button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachments.map((a) => {
            const Icon = KIND_ICON[a.kind] || Paperclip;
            return (
              <span key={a.id} className="flex items-center gap-1.5 rounded-full border border-border/60 bg-foreground/5 px-2.5 py-1 text-xs">
                <Icon className="h-3 w-3 text-primary" />
                <span className="max-w-[180px] truncate">{a.label}</span>
                <button onClick={() => removeAtt(a.id)} className="text-muted-foreground transition-colors hover:text-destructive"><X className="h-3 w-3" /></button>
              </span>
            );
          })}
        </div>
      )}

      {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
    </div>
  );
}