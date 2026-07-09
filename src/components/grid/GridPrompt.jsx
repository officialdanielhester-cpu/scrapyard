import React, { useState } from "react";
import { ArrowUp, Sparkles, Loader2, Square, Box as BoxIcon } from "lucide-react";
import { generateModel } from "@/components/grid/model-generator";

export default function GridPrompt({ onCreated }) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("2d");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async (e) => {
    e?.preventDefault();
    const text = prompt.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      await generateModel(text, mode);
      setPrompt("");
      onCreated && onCreated(mode);
    } catch (err) {
      setError(err.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Tell Jabber what to make
          </span>
        </div>
        <div className="flex rounded-full border border-border/60 p-0.5">
          <button
            type="button"
            onClick={() => setMode("2d")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "2d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Square className="h-3.5 w-3.5" strokeWidth={2} /> 2D
          </button>
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "3d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BoxIcon className="h-3.5 w-3.5" strokeWidth={2} /> 3D
          </button>
        </div>
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
          placeholder={mode === "2d" ? "e.g. a crystalline spire humming with cold light…" : "e.g. a liquid-metal orchid blooming in zero gravity…"}
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
      <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
        {mode === "2d" ? "2D image — Jabber generates any shape you describe" : "3D object — AI imagery wrapped onto a 3D surface"}
      </p>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}