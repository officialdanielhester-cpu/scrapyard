import React, { useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    type: { type: "string", enum: ["box", "sphere", "cylinder", "cone", "torus", "plane", "octahedron", "icosahedron", "tetrahedron", "dodecahedron"] },
    color: { type: "string" },
    scale: { type: "number" },
    rotX: { type: "number" },
    rotY: { type: "number" },
    rotZ: { type: "number" },
  },
  required: ["name", "type", "color"],
};

const EXAMPLES = ["a glossy red apple", "a tall green crystal", "a flat blue landing pad", "a golden ring"];

// Slide-over that asks Jabber to generate a model spec from a description,
// then drops the resulting object into the workspace.
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
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Jabber generating a 3D model spec for a Blender-style studio. From the user's description, choose the best primitive type from [box, sphere, cylinder, cone, torus, plane, octahedron, icosahedron, tetrahedron, dodecahedron], a fitting hex color, a scale between 0.5 and 3, and rotation in radians (rotX/rotY/rotZ). Give a short name. User: "${prompt}"`,
        response_json_schema: SCHEMA,
      });
      onAdd({
        name: res.name || "Generated",
        geometry: res.type,
        color: res.color || "#3b82f6",
        scale: res.scale || 1,
        rotX: res.rotX || 0,
        rotY: res.rotY || 0,
        rotZ: res.rotZ || 0,
      });
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
            <h3 className="font-heading text-sm font-bold">Jabber Model</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Describe a shape and Jabber will generate and drop it into the workspace — then edit it like any object.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. a glossy red apple"
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
            {busy ? "Generating…" : "Generate & Add"}
          </button>
        </div>
      </div>
    </div>
  );
}