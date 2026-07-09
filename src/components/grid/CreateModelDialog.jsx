import React, { useState } from "react";
import { X, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function CreateModelDialog({ open, onClose, onCreate }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({
        prompt: `3D abstract model concept: ${prompt}. High-key studio lighting, weightless, futuristic, mercury silver and electric cerulean, pristine, minimal, heavy negative space, no text, no faces, no hardware.`,
      });
      if (!url) throw new Error("No image returned");
      onCreate({
        id: Date.now().toString(),
        name: prompt.trim().slice(0, 32),
        type: "ai",
        image: url,
      });
      setPrompt("");
    } catch (e) {
      setError(e.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border/60 bg-background p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-xl font-extrabold tracking-tight">Create with AI</h2>
            <p className="mt-1 text-sm text-muted-foreground">Describe anything — complete freedom.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 transition-colors hover:bg-foreground/5"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. a floating obsidian monolith refracting light, or a liquid-metal orchid blooming in zero gravity..."
          rows={4}
          className="mt-5 w-full resize-none rounded-xl border border-border/60 bg-background p-4 text-sm placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
        />

        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

        <div className="mt-5 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Powered by Jabber
          </span>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-30"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}