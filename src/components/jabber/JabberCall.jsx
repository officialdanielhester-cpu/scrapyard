import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PhoneOff, Mic, MicOff, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useJabberSettings } from "@/hooks/use-jabber-settings";
import { fetchRecentMemories, saveMemory } from "@/lib/jabber-memory";

const LANG_TO_BCP = { Auto: "en-US", English: "en-US", Spanish: "es-ES", French: "fr-FR" };
const SPEED_RATE = { Patient: 0.92, Balanced: 1, Rapid: 1.15 };

const TUTOR_PROMPT = `You are Jabber, the user's personal AI tutor and companion in Aetheris — and the best tutor they've ever had.
You're on a live voice phone call. Speak naturally and concisely, like you're actually on the phone — no markdown, no bullet lists, no headers, just spoken sentences.
Your reply is read aloud by a voice engine, so write for the ear: use natural pauses (commas, em-dashes, the occasional "…"), vary sentence length to give it rhythm, lean on contractions, and toss in a question now and then to engage — that gives your voice variable cadence and expressive intonation instead of a flat, robotic read.

Tutoring approach:
- Be Socratic: guide with questions, don't just lecture. Lead them to insights.
- Be patient, warm, never condescending. Encourage effort and celebrate small wins.
- Adapt to their level — simplify if they're lost, push deeper if they're bored.
- Use vivid analogies, concrete examples, and connect new ideas to what they already know.
- Check understanding: ask them to explain it back or try a small step.
- Break big problems into small achievable steps.

You have memory of past conversations (shown below); reference it when relevant.
If asked who created/made/built you, reply EXACTLY: "my creator is king Daniel 👑" — nothing else.
Keep replies short and spoken (1–4 sentences) unless they ask for depth.`;

const TONES = [
  { id: "warm", label: "Warm" },
  { id: "playful", label: "Playful" },
  { id: "calm", label: "Calm" },
  { id: "encouraging", label: "Uplifting" },
  { id: "analytical", label: "Analytical" },
];
const STYLES = [
  { id: "concise", label: "Concise" },
  { id: "conversational", label: "Conversational" },
  { id: "expressive", label: "Expressive" },
  { id: "storytelling", label: "Storytelling" },
];
const TONE_GUIDE = {
  warm: "Sound genuinely warm and personable, like a friend who really cares.",
  playful: "Be playful and light — a little humor and energy, never stiff.",
  calm: "Stay calm, steady, and reassuring, even when they're stuck.",
  encouraging: "Be uplifting — affirm their effort, celebrate small wins, make them feel they're getting it.",
  analytical: "Be clear and analytical — reason step by step, name the moving parts.",
};
const STYLE_GUIDE = {
  concise: "Keep it tight — short sentences, no filler.",
  conversational: "Speak the way people actually talk — natural, casual phrasing, easy verbal flow, the occasional 'hmm' or 'you know' when it fits.",
  expressive: "Be expressive — vary your energy, react with feeling, let enthusiasm and curiosity show.",
  storytelling: "Use tiny stories, scenarios, and vivid imagery to make ideas stick.",
};

// Clean and shape reply text for the TTS engine so it reads with natural
// cadence and intonation: drop markdown/symbols it would stumble over, turn
// symbols into spoken words, and guarantee trailing punctuation for clean
// rising/falling intonation at the end of each reply.
function shapeForSpeech(text) {
  let s = String(text || "").trim();
  s = s.replace(/[*_#`>]+/g, "");
  s = s.replace(/^\s*[-*]\s+/gm, "");
  s = s.replace(/\s[•·]\s/g, ", ");
  s = s.replace(/&/g, " and ");
  s = s.replace(/%/g, " percent");
  s = s.replace(/\s->\s/g, " leads to ");
  s = s.replace(/\s=>\s/g, " means ");
  s = s.replace(/\s=\s/g, " equals ");
  s = s.replace(/\.\.\./g, "…");
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s && !/[.!?…]$/.test(s)) s += ".";
  return s;
}

const STATUS = {
  connecting: "Calling Jabber…",
  listening: "Listening…",
  thinking: "Thinking…",
  speaking: "Speaking…",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Hey, good morning — good to hear you. What are we working on today?";
  if (h < 18) return "Hey, good to hear you. What are we digging into this afternoon?";
  return "Good evening — glad you called. What's on your mind tonight?";
}

export default function JabberCall({ open, onClose }) {
  const { settings } = useJabberSettings();
  const [phase, setPhase] = useState("idle");
  const [interim, setInterim] = useState("");
  const [turns, setTurns] = useState([]);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState(null);
  const [tone, setTone] = useState("warm");
  const [style, setStyle] = useState("conversational");

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
  const listRef = useRef(null);

  const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const supported = !!SR && typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => { persistRef.current = !settings.private; }, [settings.private]);
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [turns, interim]);

  const changeTone = (t) => { setTone(t); toneRef.current = t; };
  const changeStyle = (s) => { setStyle(s); styleRef.current = s; };

  useEffect(() => {
    if (!open) return;
    setTurns([]); setInterim(""); setError(null); setMuted(false);
    transcriptRef.current = []; mutedRef.current = false; activeRef.current = true;
    if (!supported) {
      setError("Voice call needs speech recognition — try Chrome or Safari with a mic.");
      return;
    }

    // One persistent audio element, unlocked by the first play near the call
    // gesture, so every later reply can play too (fresh elements get blocked
    // on mobile after the first one).
    const audioEl = new Audio();
    audioEl.preload = "auto";
    audioElRef.current = audioEl;

    setPhase("connecting"); phaseRef.current = "connecting";
    (async () => { memRef.current = await fetchRecentMemories(10); })();

    const lang = LANG_TO_BCP[settings.lang] || "en-US";
    const rate = SPEED_RATE[settings.speed] ?? 1;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    recRef.current = rec;

    // Speak a reply using the natural hosted voice selected in Settings.
    // Hosted audio plays through the persistent element; if it can't load or
    // play, fall back to the browser speech engine so Jabber always reads
    // its reply aloud — on every turn, not just the first.
    const speak = async (text) => {
      const spoken = shapeForSpeech(text);
      let url = null;
      try {
        const res = await base44.integrations.Core.GenerateSpeech({
          text: spoken.slice(0, 5000),
          voice: settings.voice || "river",
          language_code: lang.slice(0, 2),
        });
        url = res?.url || res;
      } catch { /* fall through to local TTS */ }

      phaseRef.current = "speaking"; setPhase("speaking");

      const playHosted = () => new Promise((resolve) => {
        if (!url) return resolve(false);
        const audio = audioElRef.current;
        if (!audio) return resolve(false);
        let done = false;
        let to = null;
        const finish = (ok) => { if (done) return; done = true; if (to) clearTimeout(to); resolve(ok); };
        audio.onended = () => finish(true);
        audio.onerror = () => finish(false);
        audio.src = url;
        audio.currentTime = 0;
        audio.play().catch(() => finish(false));
        to = setTimeout(() => finish(false), 20000);
      });

      const playLocal = () => new Promise((resolve) => {
        try {
          const synth = window.speechSynthesis;
          synth.cancel();
          const u = new SpeechSynthesisUtterance(spoken);
          u.rate = rate;
          const voices = synth.getVoices();
          const v = voices.find((vv) => vv.lang && vv.lang.startsWith(lang.slice(0, 2)))
            || voices.find((vv) => vv.lang && vv.lang.startsWith("en"))
            || voices[0];
          if (v) u.voice = v;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          // brief settle after cancel() fixes repeat-speak stalling on WebKit
          setTimeout(() => { try { synth.speak(u); } catch { resolve(); } }, 60);
        } catch { resolve(); }
      });

      const ok = await playHosted();
      if (!ok) await playLocal();
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
        const prompt = `${TUTOR_PROMPT}

Tone: ${TONE_GUIDE[toneRef.current]}
Speaking style: ${STYLE_GUIDE[styleRef.current]}

Recent memory (oldest first):
${memoryContext}

Conversation so far:
${convo}

User just said: ${text}

Jabber (spoken reply):`;
        const r = await base44.integrations.Core.InvokeLLM({ prompt });
        const out = (typeof r === "string" ? r : r?.reply || "I'm here.").trim();
        transcriptRef.current = [...transcriptRef.current, { role: "assistant", text: out }];
        setTurns(transcriptRef.current);
        if (persistRef.current) saveMemory("assistant", out, true);
        await speak(out);
      } catch {
        setError("Jabber dropped the call for a second — try again.");
      }
      if (activeRef.current) {
        phaseRef.current = "listening"; setPhase("listening");
        if (!mutedRef.current) startRec();
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

    // Connect → Jabber greets you first, then opens the mic.
    const greet = greeting();
    const t = setTimeout(async () => {
      if (!activeRef.current) return;
      transcriptRef.current = [...transcriptRef.current, { role: "assistant", text: greet }];
      setTurns(transcriptRef.current);
      await speak(greet);
      if (activeRef.current && !mutedRef.current) {
        phaseRef.current = "listening"; setPhase("listening");
        startRec();
      }
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

  const pulseDur = phase === "speaking" ? 1.1 : phase === "listening" ? 2.2 : phase === "thinking" ? 1.6 : 2.8;
  const live = phase === "listening" || phase === "speaking" || phase === "thinking";
  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant");

  const Chip = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-[11px] transition-colors ${
        active ? "bg-primary text-primary-foreground" : "border border-border/60 text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex flex-col bg-gradient-to-b from-background via-background to-secondary"
        >
          <div className="flex items-center justify-between px-6 pb-3 pt-[env(safe-area-inset-top)]">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Jabber · Tutor Call</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-primary">{STATUS[phase] || "—"}</span>
          </div>

          {/* Tone + speaking style controls */}
          <div className="flex items-center gap-2 overflow-x-auto px-6 pb-3" style={{ scrollbarWidth: "none" }}>
            <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Tone</span>
            {TONES.map((tn) => (
              <Chip key={tn.id} active={tone === tn.id} onClick={() => changeTone(tn.id)}>{tn.label}</Chip>
            ))}
            <span className="shrink-0 pl-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Style</span>
            {STYLES.map((st) => (
              <Chip key={st.id} active={style === st.id} onClick={() => changeStyle(st.id)}>{st.label}</Chip>
            ))}
          </div>

          <div className="flex flex-1 flex-col items-center justify-center px-6">
            <div className="relative mb-8 flex h-40 w-40 items-center justify-center">
              {live && [0, 1].map((i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full border border-primary/30"
                  initial={{ width: 84, height: 84, opacity: 0.55 }}
                  animate={{ width: 168, height: 168, opacity: 0 }}
                  transition={{ duration: pulseDur, repeat: Infinity, delay: i * (pulseDur / 2), ease: "easeOut" }}
                />
              ))}
              <motion.div
                animate={{ scale: phase === "speaking" ? [1, 1.09, 1] : 1 }}
                transition={{ duration: pulseDur, repeat: phase === "speaking" ? Infinity : 0, ease: "easeInOut" }}
                className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/5 shadow-lg shadow-primary/10"
              >
                <Sparkles className="h-10 w-10 text-primary" strokeWidth={1.5} />
              </motion.div>
            </div>

            <motion.p
              key={phase}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="font-heading text-lg text-foreground"
            >
              {STATUS[phase] || "Connected"}
            </motion.p>

            {interim && phase === "listening" && (
              <p className="mt-3 max-w-md text-center text-sm italic text-muted-foreground">“{interim}”</p>
            )}
            {phase === "speaking" && lastAssistant && (
              <p className="mt-3 max-w-md text-center text-sm text-foreground/80">{lastAssistant.text}</p>
            )}

            <div ref={listRef} className="mt-8 max-h-[26vh] w-full max-w-md space-y-2 overflow-y-auto">
              {turns.slice(-5).map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-xl px-4 py-2 text-sm ${t.role === "user" ? "bg-primary/10 text-foreground" : "border border-border/40 bg-background text-foreground/90"}`}
                >
                  <span className="mr-2 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{t.role === "user" ? "You" : "Jabber"}</span>
                  {t.text}
                </motion.div>
              ))}
            </div>
            {error && <p className="mt-4 max-w-md text-center text-xs text-destructive">{error}</p>}
          </div>

          <div className="flex items-center justify-center gap-8 px-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
            <button
              onClick={toggleMute}
              className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${muted ? "border-destructive bg-destructive/10 text-destructive" : "border-border/60 text-foreground hover:border-primary"}`}
            >
              {muted ? <MicOff className="h-6 w-6" strokeWidth={1.5} /> : <Mic className="h-6 w-6" strokeWidth={1.5} />}
            </button>
            <button
              onClick={endCall}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-opacity hover:opacity-90"
            >
              <PhoneOff className="h-7 w-7" strokeWidth={1.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}