import React, { useState } from "react";
import { X, Loader2, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    parts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["box", "sphere", "cylinder", "cone", "torus", "plane", "octahedron", "icosahedron", "tetrahedron", "dodecahedron"] },
          ox: { type: "number" }, oy: { type: "number" }, oz: { type: "number" },
          sx: { type: "number" }, sy: { type: "number" }, sz: { type: "number" },
          rx: { type: "number" }, ry: { type: "number" }, rz: { type: "number" },
        },
        required: ["type", "ox", "oy", "oz", "sx", "sy", "sz"],
      },
    },
  },
  required: ["name", "parts"],
};

const PRIMS = "box, sphere, cylinder, cone, torus, plane, octahedron, icosahedron, tetrahedron, dodecahedron";
const EXAMPLES = ["a medieval longsword", "a pine tree", "an office chair", "a sports car", "a coffee mug"];

// Slide-over that asks Jabber to compose a detailed, recognizable multi-part 3D
// model from a description, then drops it into the workspace as a neutral grey sculpt.
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
        prompt: `You are Jabber, a 3D model composer in a Blender-style studio. Build a detailed multi-part 3D model that resembles the user's request as closely and recognizably as possible, composing primitive building blocks [${PRIMS}]. Use 5 to 30 parts with precise offsets (ox/oy/oz), scales (sx/sy/sz), and rotations (rx/ry/rz in radians) so the assembled object is proportional and clearly recognizable. Reason about the real silhouette first: e.g. a sword = long thin box blade + crossguard box + cylindrical handle + spherical pommel; a tree = brown cylinder trunk + several green spheres for foliage; a chair = seat box + four leg boxes + back box; a car = low body box + cabin box + four wheel cylinders. The origin sits at the object's base center; keep the whole model roughly within a 3x3x3 unit volume centered on the origin and resting just above y=0. Do not assign color — the model spawns neutral grey and is customized later. Give a short, specific name. Output only the JSON. User request: "${prompt}"`,
        response_json_schema: SCHEMA,
      });
      onAdd({ name: res.name || "Generated", parts: Array.isArray(res.parts) ? res.parts : [] });
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
            Describe anything and Jabber composes a detailed, recognizable 3D model from it — spawning in neutral grey so you can sculpt, color, and finish it yourself.
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
            {busy ? "Composing…" : "Generate & Add"}
          </button>
        </div>
      </div>
    </div>
  );
}