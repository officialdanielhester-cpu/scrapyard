import React, { useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EXAMPLES = ["a medieval longsword", "a pine tree", "an office chair", "a sports car", "a coffee mug", "a red dragon"];

// Slide-over that asks Jabber to generate a photorealistic, specific item via
// AI image generation, then drops it into the workspace as a real 3D object
// (textured card) — no primitive shapes, no grid constraint.
export default function JabberModelGen({ open, onClose, onAdd }) {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) return null;

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const item = prompt.trim();
      const imgPrompt = `A photorealistic 3D product render of ${item}, isolated on a fully transparent background, centered, the complete object fully visible and in frame, soft studio lighting, ultra-detailed realistic PBR materials, sharp focus, high fidelity, no pedestal, no text, no watermark, PNG with alpha transparency.`;
      const img = await base44.integrations.Core.GenerateImage({ prompt: imgPrompt });
      const imageUrl = img?.url || img;
      if (!imageUrl) throw new Error("No image came back.");
      onAdd({ name: item.charAt(0).toUpperCase() + item.slice(1, 28), kind: "image", imageUrl });
      setPrompt("");
      onClose();
    } catch (e) {
      setErr(e.message || "Jabber couldn't generate that.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-border/60 bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-heading text-sm font-bold">Generate Model</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Describe anything and Jabber generates a photorealistic, specific item — a real sword, tree, chair, car, creature — and drops it into the workspace as a true 3D object you can move, rotate, and scale. No grid, no preset shapes.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a medieval longsword"
            rows={3}
            className="w-full resize-none rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setPrompt(ex)}
                className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-primary hover:text-primary"
              >
                {ex}
              </button>
            ))}
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <button
            onClick={generate}
            disabled={!prompt.trim() || busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {busy ? "Generating realistic model…" : "Generate & Add"}
          </button>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            Uses AI image generation · takes ~5–10s
          </p>
        </div>
      </div>
    </div>
  );
}