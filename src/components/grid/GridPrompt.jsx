import React, { useState } from "react";
import { ArrowUp, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GridPrompt({ onCreate }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = prompt.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `3D abstract model concept: ${text}. High-key studio lighting, weightless, futuristic, mercury silver and electric cerulean, pristine, minimal, heavy negative space, no text, no faces, no hardware.`,
      });
      if (!url) throw new Error("No image returned");
      onCreate({ id: Date.now().toString(), name: text.slice(0, 32), type: "ai", image: url });
      setPrompt("");
    } catch (err) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          Tell Jabber what to make
        </span>
      </div>
      <form onSubmit={handleSend} className="flex items-end gap-3">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="e.g. a floating obsidian monolith refracting light, or a liquid-metal orchid blooming in zero gravity…"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-border/60 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!prompt.trim() || loading}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-80 disabled:opacity-30"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2} />}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}