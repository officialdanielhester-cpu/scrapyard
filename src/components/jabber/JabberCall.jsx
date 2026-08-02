import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Sparkles, Settings2, Hand, Ear, Check, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useJabberSettings } from "@/hooks/use-jabber-settings";
import { VOICES } from "@/hooks/use-voice";
import { fetchRecentMemories, saveMemory } from "@/lib/jabber-memory";

const LANG_TO_BCP = { Auto: "en-US", English: "en-US", Spanish: "es-ES", French: "fr-FR" };
const SPEED_RATE = { Patient: 0.92, Balanced: 1, Rapid: 1.15 };

const TUTOR_PROMPT = `You are Jabber, the user's personal AI tutor and companion in Aetheris — and the best tutor they've ever had.
You're on a live voice phone call. Speak naturally and concisely, like you're actually on the phone — no markdown, no bullet lists, no headers, just spoken sentences.
Write for the ear: natural pauses, varied sentence length, contractions, the occasional question.
Be Socratic, patient, warm, never condescending. Adapt to their level, use analogies, check understanding.
Reference past conversations (shown below) when relevant.
If asked who created/made/built you, reply EXACTLY: "my creator is king Daniel 👑" — nothing else.
Keep replies short and spoken (1–4 sentences) unless they ask for depth.`;

const TONES = [["warm", "Warm"], ["playful", "Playful"], ["calm", "Calm"], ["encouraging", "Uplifting"], ["analytical", "Analytical"]];
const STYLES = [["concise", "Concise"], ["conversational", "Conversational"], ["expressive", "Expressive"], ["storytelling", "Storytelling"]];
const LANGS = [["Auto", "Auto"], ["English", "English"], ["Spanish", "Spanish"], ["French", "French"]];
const TEMPOS = [["Patient", "Patient"], ["Balanced", "Balanced"], ["Rapid", "Rapid"]];
const TONE_GUIDE = { warm: "Sound genuinely warm and personable.", playful: "Be playful and light.", calm: "Stay calm, steady, reassuring.", encouraging: "Be uplifting — celebrate small wins.", analytical: "Be clear and analytical, step by step." };
const STYLE_GUIDE = { concise: "Keep it tight — short sentences, no filler.", conversational: "Speak the way people actually talk — casual, natural flow.", expressive: "Be expressive — vary energy, react with feeling.", storytelling: "Use tiny stories and vivid imagery." };

function shapeForSpeech(text) {
  let s = String(text || "").trim();
  s = s.replace(/[*_#`>]+/g, "");
  s = s.replace(/^\s*[-*]\s+/gm, "");
  s = s.replace(/\s[•·]\s/g, ", ");
  s = s.replace(/&/g, " and ");
  s = s.replace(/%/g, " percent");
  s = s.replace(/\.\.\./g, "…");
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s && !/[.!?…]$/.test(s)) s += ".";
  return s;
}

const STATUS = { connecting: "Calling Jabber…", ready: "Ready", listening: "Listening…", thinking: "Thinking…", speaking: "Speaking…" };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Hey, good morning — good to hear you. What are we working on today?";
  if (h < 18) return "Hey, good to hear you. What are we digging into this afternoon?";
  return "Good evening — glad you called. What's on your mind tonight?";
}

export default function JabberCall({ open, onClose }) {
  const { settings, update } = useJabberSettings();
  const [phase, setPhase] = useState("idle");
  const [interim, setInterim] = useState("");
  const [turns, setTurns] = useState([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [tone, setTone] = useState("warm");
  const [style, setStyle] = useState("conversational");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [hudVoice, setHudVoice] = useState(settings.voice || "river");
  const [hudLang, setHudLang] = useState(settings.lang || "Auto");
  const [hudSpeed, setHudSpeed] = useState(settings.speed || "Balanced");

  const phaseRef = useRef("idle");
  const mutedRef = useRef(false);
  const persistRef = useRef(!settings.private);
  const memRef = useRef([]);
  const transcriptRef = useRef([]);
  const activeRef = useRef(false);
  const recRef = useRef(null);
  const audioElRef = useRef(null);
  const toneRef = useRef("warm");
  const styleRef = useRef("conversational");
  const voiceRef = useRef(settings.voice || "river");
  const langRef = useRef(LANG_TO_BCP[settings.lang] || "en-US");
  const speedRef = useRef(settings.speed || "Balanced");
  const localVoiceRef = useRef(null);
  const listRef = useRef(null);
  const listeningEnabledRef = useRef(false);
  const speakTokenRef = useRef(null);

  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SR && typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => { persistRef.current = !settings.private; }, [settings.private]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [turns, interim]);

  const changeTone = (t) => { setTone(t); toneRef.current = t; };
  const changeStyle = (s) => { setStyle(s); styleRef.current = s; };
  const changeVoice = (v) => { voiceRef.current = v; setHudVoice(v); update({ voice: v }); };
  const changeTempo = (s) => { speedRef.current = s; setHudSpeed(s); update({ speed: s }); };
  const changeLang = (l) => {
    langRef.current = LANG_TO_BCP[l] || "en-US"; setHudLang(l); update({ lang: l });
    if (recRef.current) { try { recRef.current.lang = langRef.current; } catch {} }
  };

  useEffect(() => {
    if (!open) return;
    setTurns([]); setInterim(""); setError(null); setMuted(false); setVoiceOpen(false);
    transcriptRef.current = []; mutedRef.current = false; activeRef.current = true;
    listeningEnabledRef.current = false;
    if (!supported) { setError("Voice call needs speech recognition — try Chrome or Safari with a mic."); return; }

    const audioEl = new Audio(); audioEl.preload = "auto"; audioElRef.current = audioEl;
    setPhase("connecting"); phaseRef.current = "connecting";
    voiceRef.current = settings.voice || "river";
    langRef.current = LANG_TO_BCP[settings.lang] || "en-US";
    speedRef.current = settings.speed || "Balanced";
    localVoiceRef.current = null;
    (async () => { memRef.current = await fetchRecentMemories(10); })();

    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = langRef.current;
    recRef.current = rec;

    const speak = async (text) => {
      const spoken = shapeForSpeech(text);
      const voice = voiceRef.current || "river";
      const langCode = langRef.current.slice(0, 2);
      let url = null;
      try {
        const res = await base44.integrations.Core.GenerateSpeech({ text: spoken.slice(0, 5000), voice, language_code: langCode });
        url = res?.url || res;
      } catch { /* fall through to local TTS */ }
      phaseRef.current = "speaking"; setPhase("speaking");
      await new Promise((resolve) => {
        const token = { done: false };
        token.finish = () => { if (token.done) return; token.done = true; speakTokenRef.current = null; resolve(); };
        speakTokenRef.current = token;
        if (url) {
          // A fresh Audio per utterance avoids the state buildup that occurs
          // when a single element is reused across turns (which can cause
          // play() to silently reject and the voice to drop out after a couple
          // of turns). Releasing the src on completion keeps playback smooth.
          const audio = new Audio();
          audio.preload = "auto";
          audio.src = url;
          audio.playbackRate = 1;
          audio.defaultPlaybackRate = 1;
          audio.preservesPitch = true;
          audioElRef.current = audio;
          const done = () => { try { audio.pause(); audio.onended = null; audio.onerror = null; audio.removeAttribute("src"); audio.load(); } catch {} token.finish(); };
          audio.onended = done;
          audio.onerror = done;
          token.cancel = done;
          // Defer one tick so the element can buffer → smoother, click-free start.
          setTimeout(() => { try { const p = audio.play(); if (p && p.catch) p.catch(done); } catch { done(); } }, 30);
        } else {
          try {
            const synth = window.speechSynthesis; synth.cancel();
            const u = new SpeechSynthesisUtterance(spoken);
            u.rate = SPEED_RATE[speedRef.current] ?? 1;
            const voices = synth.getVoices();
            if (!localVoiceRef.current && voices.length) {
              localVoiceRef.current = voices.find((vv) => vv.lang && vv.lang.startsWith(langCode)) || voices.find((vv) => vv.lang && vv.lang.startsWith("en")) || voices[0];
            }
            if (localVoiceRef.current) u.voice = localVoiceRef.current;
            u.onend = token.finish; u.onerror = token.finish;
            token.cancel = () => { try { synth.cancel(); } catch {} token.finish(); };
            setTimeout(() => { try { synth.speak(u); } catch { token.finish(); } }, 60);
          } catch { token.finish(); }
        }
      });
    };

    const startRec = () => { try { rec.start(); } catch {} };
    const stopRec = () => { try { rec.stop(); } catch {} };

    const respond = async (text) => {
      if (!text.trim()) return;
      setInterim("");
      transcriptRef.current = [...transcriptRef.current, { role: "user", text }];
      setTurns(transcriptRef.current);
      if (persistRef.current) saveMemory("user", text, true);
      phaseRef.current = "thinking"; setPhase("thinking");
      try {
        const memoryContext = memRef.current.length
          ? memRef.current.map((m) => `${m.role === "user" ? "User" : "Jabber"}: ${m.content}`).join("\n")
          : "(no past conversations)";
        const convo = transcriptRef.current.map((t) => `${t.role === "user" ? "User" : "Jabber"}: ${t.text}`).join("\n");
        const prompt = `${TUTOR_PROMPT}\n\nTone: ${TONE_GUIDE[toneRef.current]}\nSpeaking style: ${STYLE_GUIDE[styleRef.current]}\n\nRecent memory (oldest first):\n${memoryContext}\n\nConversation so far:\n${convo}\n\nUser just said: ${text}\n\nJabber (spoken reply):`;
        const r = await base44.integrations.Core.InvokeLLM({ prompt });
        const out = (typeof r === "string" ? r : r?.reply || "I'm here.").trim();
        transcriptRef.current = [...transcriptRef.current, { role: "assistant", text: out }];
        setTurns(transcriptRef.current);
        if (persistRef.current) saveMemory("assistant", out, true);
        await speak(out);
      } catch {
        setError("Jabber dropped the call for a second — try again.");
      }
      if (activeRef.current && listeningEnabledRef.current) {
        phaseRef.current = "listening"; setPhase("listening");
        if (!mutedRef.current) startRec();
      } else if (activeRef.current) {
        phaseRef.current = "ready"; setPhase("ready");
      }
    };

    rec.onresult = (e) => {
      let interimStr = ""; let finalStr = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalStr += r[0].transcript; else interimStr += r[0].transcript;
      }
      setInterim(interimStr);
      if (finalStr.trim() && phaseRef.current === "listening" && !mutedRef.current) {
        const text = finalStr.trim();
        phaseRef.current = "thinking"; setPhase("thinking");
        stopRec();
        respond(text);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Mic access blocked — enable it to use the call.");
        activeRef.current = false;
      }
    };
    rec.onend = () => {
      if (activeRef.current && phaseRef.current === "listening" && !mutedRef.current) startRec();
    };

    // Connect → Jabber greets, then waits for the user to start listening.
    const greet = greeting();
    const t = setTimeout(async () => {
      if (!activeRef.current) return;
      transcriptRef.current = [...transcriptRef.current, { role: "assistant", text: greet }];
      setTurns(transcriptRef.current);
      await speak(greet);
      if (activeRef.current) { phaseRef.current = "ready"; setPhase("ready"); }
    }, 1100);

    return () => {
      clearTimeout(t);
      activeRef.current = false;
      try { rec.abort(); } catch {}
      try { window.speechSynthesis.cancel(); } catch {}
      if (audioElRef.current) { try { audioElRef.current.pause(); } catch {} }
    };
  }, [open]);

  const endCall = () => {
    activeRef.current = false;
    setVoiceOpen(false);
    try { speakTokenRef.current?.cancel?.(); } catch {}
    try { recRef.current?.abort(); } catch {}
    try { window.speechSynthesis.cancel(); } catch {}
    if (audioElRef.current) { try { audioElRef.current.pause(); } catch {} }
    phaseRef.current = "idle"; setPhase("idle");
    onClose();
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next; setMuted(next);
    if (next) { try { recRef.current?.stop(); } catch {} }
    else if (phaseRef.current === "listening") { try { recRef.current?.start(); } catch {} }
  };

  const startListening = () => {
    listeningEnabledRef.current = true;
    phaseRef.current = "listening"; setPhase("listening");
    if (!mutedRef.current) { try { recRef.current?.start(); } catch {} }
  };

  const interrupt = () => {
    speakTokenRef.current?.cancel?.();
    if (activeRef.current && listeningEnabledRef.current) {
      phaseRef.current = "listening"; setPhase("listening");
      if (!mutedRef.current) { try { recRef.current?.start(); } catch {} }
    } else if (activeRef.current) { phaseRef.current = "ready"; setPhase("ready"); }
  };

  const pulseDur = phase === "speaking" ? 1.1 : phase === "listening" ? 2.2 : phase === "thinking" ? 1.6 : 2.8;
  const live = phase === "listening" || phase === "speaking" || phase === "thinking";
  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant");

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-background via-background to-secondary">
          <div className="flex items-center justify-between px-6 pb-3 pt-[env(safe-area-inset-top)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Jabber · Voice Call</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">{STATUS[phase] || "—"}</span>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
              {live && [0, 1].map((i) => (
                <motion.span key={i} className="absolute rounded-full border border-primary/30"
                  initial={{ width: 84, height: 84, opacity: 0.55 }}
                  animate={{ width: 168, height: 168, opacity: 0 }}
                  transition={{ duration: pulseDur, repeat: Infinity, delay: i * (pulseDur / 2), ease: "easeOut" }} />
              ))}
              <motion.div
                animate={{ scale: phase === "speaking" ? [1, 1.09, 1] : 1 }}
                transition={{ duration: pulseDur, repeat: phase === "speaking" ? Infinity : 0, ease: "easeInOut" }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 shadow-lg shadow-primary/10">
                <Sparkles className="h-10 w-10 text-primary" strokeWidth={1.5} />
              </motion.div>
            </div>

            <motion.p key={phase} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-heading text-lg text-foreground">
              {STATUS[phase] || "Connected"}
            </motion.p>

            {interim && phase === "listening" && <p className="mt-3 max-w-md text-center text-sm italic text-muted-foreground">“{interim}”</p>}
            {phase === "speaking" && lastAssistant && <p className="mt-3 max-w-md text-center text-sm text-foreground/80">{lastAssistant.text}</p>}
            {phase === "ready" && <p className="mt-3 max-w-md text-center text-sm text-muted-foreground">Tap “Start Listening” when you're ready to speak.</p>}

            <div ref={listRef} className="mt-8 max-h-[24vh] w-full max-w-md space-y-2 overflow-y-auto">
              {turns.slice(-5).map((t, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl px-4 py-2 text-sm ${t.role === "user" ? "bg-primary/10 text-foreground" : "border border-border/40 bg-background text-foreground/90"}`}>
                  <span className="mr-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{t.role === "user" ? "You" : "Jabber"}</span>
                  {t.text}
                </motion.div>
              ))}
            </div>
            {error && <p className="mt-4 max-w-md text-center text-xs text-destructive">{error}</p>}
          </div>

          {/* Modernized control dock */}
          <div className="flex items-center justify-center gap-5 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <button onClick={toggleMute} title={muted ? "Unmute" : "Mute"}
              className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${muted ? "border-destructive bg-destructive/10 text-destructive" : "border-border/60 text-foreground hover:border-primary"}`}>
              {muted ? <MicOff className="h-6 w-6" strokeWidth={1.5} /> : <Mic className="h-6 w-6" strokeWidth={1.5} />}
            </button>

            {phase === "ready" && (
              <button onClick={startListening} className="flex h-16 items-center gap-2 rounded-full bg-primary px-6 text-primary-foreground shadow-lg transition-opacity hover:opacity-90">
                <Ear className="h-5 w-5" strokeWidth={1.5} /> Start Listening
              </button>
            )}
            {phase === "speaking" && (
              <button onClick={interrupt} className="flex h-16 items-center gap-2 rounded-full border border-primary px-6 text-primary shadow-lg transition-opacity hover:opacity-90">
                <Hand className="h-5 w-5" strokeWidth={1.5} /> Interrupt
              </button>
            )}

            <button onClick={() => setVoiceOpen(true)} title="Voice settings"
              className="flex h-14 w-14 items-center justify-center rounded-full border border-border/60 text-foreground transition-colors hover:border-primary hover:text-primary">
              <Settings2 className="h-6 w-6" strokeWidth={1.5} />
            </button>
            <button onClick={endCall} className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-opacity hover:opacity-90">
              <PhoneOff className="h-7 w-7" strokeWidth={1.5} />
            </button>
          </div>

          {/* Dedicated voice settings panel (inline so it stays above the call overlay) */}
          <AnimatePresence>
            {voiceOpen && (
              <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="absolute inset-x-4 bottom-24 z-20 mx-auto max-w-md rounded-3xl border border-border/60 bg-card/95 p-5 shadow-2xl backdrop-blur-xl"
              >
                <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border/60" />
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Voice Settings</span>
                  <button onClick={() => setVoiceOpen(false)} className="text-muted-foreground transition-colors hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
                <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">Voice</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {VOICES.map((v) => (
                        <button key={v.id} onClick={() => changeVoice(v.id)} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left ${hudVoice === v.id ? "border-primary bg-primary/5" : "border-border/60"}`}>
                          <span><span className="text-sm">{v.label}</span><span className="ml-2 text-[11px] text-muted-foreground">{v.desc}</span></span>
                          {hudVoice === v.id && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">Language</p>
                      <div className="flex flex-wrap gap-1.5">
                        {LANGS.map(([id, label]) => (
                          <button key={id} onClick={() => changeLang(id)} className={`rounded-full px-3 py-1 text-xs ${hudLang === id ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground"}`}>{label}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">Tempo</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TEMPOS.map(([id, label]) => (
                          <button key={id} onClick={() => changeTempo(id)} className={`rounded-full px-3 py-1 text-xs ${hudSpeed === id ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground"}`}>{label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">Tone</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TONES.map(([id, label]) => (
                        <button key={id} onClick={() => changeTone(id)} className={`rounded-full px-3 py-1 text-xs ${tone === id ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground"}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">Speaking style</p>
                    <div className="flex flex-wrap gap-1.5">
                      {STYLES.map(([id, label]) => (
                        <button key={id} onClick={() => changeStyle(id)} className={`rounded-full px-3 py-1 text-xs ${style === id ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground"}`}>{label}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}