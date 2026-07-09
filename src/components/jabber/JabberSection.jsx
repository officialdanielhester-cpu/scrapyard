import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, Volume2, VolumeX } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useVoice } from "@/hooks/use-voice";

const SEED_MESSAGES = [
  {
    role: "assistant",
    content:
      "I'm Jabber — your ambient intelligence layer. Ask me to architect a thought, or try one of the pulses below.",
  },
];

const SUGGESTIONS = [
  "Summarize my day",
  "Draft a quiet reply",
  "Find a pattern in my notes",
];

export default function JabberSection() {
  const { speakEnabled, setSpeakEnabled, speak, speaking } = useVoice();
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking, speaking]);

  const handleSend = async (text) => {
    const content = (text ?? input).trim();
    if (!content || thinking) return;
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content }]);
    setInput("");
    setThinking(true);
    try {
      const history = messages
        .slice(-6)
        .map((m) => `${m.role === "user" ? "User" : "Jabber"}: ${m.content}`)
        .join("\n");
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Jabber, an ambient intelligence layer — calm, concise, quietly insightful. Reply in 1-3 short sentences.\n\n${history}\nUser: ${content}\nJabber:`,
      });
      const reply =
        typeof res === "string"
          ? res
          : (res && (res.response || res.text || res.content)) || "I'm here.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (speakEnabled) speak(reply);
    } catch (e) {
      setError(e.message || "Jabber stumbled — try again.");
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-border/40 px-6 py-5 md:px-12">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">Jabber</h1>
          <p className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            The Conversation Layer
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 px-3 py-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${speaking ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {speaking ? "Speaking" : "Listening"}
          </span>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60">
                  <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed transition-all ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border/50 bg-background"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="mr-3 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60">
                <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl border border-border/50 px-5 py-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-primary/70"
                    style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.length === 1 && !thinking && (
            <div className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="rounded-full border border-border/60 px-4 py-2 text-sm text-foreground/80 transition-all hover:border-primary hover:text-primary"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/40 px-6 py-6 md:px-12">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="group relative"
          >
            <div className="flex items-end gap-3 border-b border-border pb-3 transition-colors focus-within:border-primary">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What shall we architect today?"
                className="flex-1 bg-transparent py-1 font-body text-lg text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSpeakEnabled(!speakEnabled)}
                title={speakEnabled ? "Voice on" : "Voice off"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                  speakEnabled ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {speakEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:opacity-80 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </form>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {speakEnabled ? "Voice on — replies spoken aloud" : "Voice off · type to talk with Jabber"}
          </p>
        </div>
      </div>
    </div>
  );
}