import React, { useState } from "react";
import { X, Loader2, Sparkles, Boxes, Box } from "lucide-react";
import { base44 } from "@/api/base44Client";

const EXAMPLES = ["a medieval longsword", "a pine tree", "an office chair", "a sports car", "a coffee mug", "a red dragon"];

const PRIMS = ["box", "sphere", "cylinder", "cone", "torus", "plane", "octahedron", "icosahedron", "tetrahedron", "dodecahedron"];
const MESH_PRIMS = ["box", "sphere", "cylinder", "cone", "torus", "plane", "icosahedron"];

const COMPOSITE_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    realSize: { type: "number" },
    parts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: PRIMS },
          ox: { type: "number" }, oy: { type: "number" }, oz: { type: "number" },
          sx: { type: "number" }, sy: { type: "number" }, sz: { type: "number" },
          rx: { type: "number" }, ry: { type: "number" }, rz: { type: "number" },
          color: { type: "string" }
        },
        required: ["type"]
      }
    }
  },
  required: ["name", "parts"]
};

const MESH_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    geometry: { type: "string", enum: MESH_PRIMS },
    color: { type: "string" },
    realSize: { type: "number" },
    metal: { type: "number" },
    rough: { type: "number" }
  },
  required: ["name", "geometry"]
};

const title = (s) => s.charAt(0).toUpperCase() + s.slice(1, 28);
const clamp01 = (v, d) => Math.max(0, Math.min(1, Number(v) || d));

// Slide-over that asks Jabber to compose a REAL 3D model from the prompt.
// Composite = multi-part assembly (paintable). Mesh = a single sculptable
// primitive the user can deform, subdivide, and vertex-paint.
export default function JabberModelGen({ open, onClose, onAdd }) {
  const [prompt, setPrompt] = useState("");
  const [buildMode, setBuildMode] = useState("composite");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  if (!open) return null;

  const generate = async () => {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const item = prompt.trim();
      if (buildMode === "mesh") {
        const meshPrompt = `You are a 3D modeler. Pick the single primitive that best matches the overall form of the described object — it will be sculpted into detail by hand, so choose the right starting shape and proportions.
Available primitive types: ${MESH_PRIMS.join(", ")}.
Pick a hex base color (like "#8B5A2B"), metalness (0-1), roughness (0-1), and realSize = the object's real-world length/height in meters (sword ~1.0, car ~4.5, dog ~0.6, house ~8, mug ~0.1). realSize sets the model's scale relative to other models.
Object: "${item}"
Return JSON: { name, geometry, color, realSize, metal, rough }.`;
        const res = await base44.integrations.Core.InvokeLLM({ prompt: meshPrompt, response_json_schema: MESH_SCHEMA });
        const geometry = MESH_PRIMS.includes(res?.geometry) ? res.geometry : "box";
        onAdd({ kind: "mesh", name: title(res?.name || item), geometry, color: res?.color || "#d4d4d8", realSize: Number(res?.realSize) || 1.5, metal: clamp01(res?.metal, 0.3), rough: clamp01(res?.rough, 0.55) });
      } else {
        const composePrompt = `You are a 3D model composer. Build the described object as a small assembly of primitive 3D shapes so it reads as a real, recognizable 3D model — never a flat image or a texture.
Available primitive types: ${PRIMS.join(", ")}.
Coordinate system: x points right, y points up, z points toward the camera. Center the whole model near the origin and keep every part within roughly ±1.5 units. A 1×1×1 box is about fist-sized, so scale parts to match real proportions. Use 2–8 parts. Pick a hex color (like "#8B5A2B") for each part that matches its real material. Use ox/oy/oz for a part's center offset, sx/sy/sz for per-axis scale (1 = default primitive size), and rx/ry/rz for rotation in radians.
Also set realSize = the object's real-world length/height in meters (sword ~1.0, car ~4.5, dog ~0.6, house ~8, mug ~0.1). This sets its scale relative to other models.
Object to build: "${item}"
Return JSON: { name, realSize, parts[] }. Make it genuinely look like the object from every angle.`;
        const res = await base44.integrations.Core.InvokeLLM({ prompt: composePrompt, response_json_schema: COMPOSITE_SCHEMA });
        const parts = Array.isArray(res?.parts)
          ? res.parts.filter((p) => p && PRIMS.includes(p.type)).map((p) => ({
              type: p.type,
              ox: Number(p.ox) || 0, oy: Number(p.oy) || 0, oz: Number(p.oz) || 0,
              sx: Number(p.sx) || 1, sy: Number(p.sy) || 1, sz: Number(p.sz) || 1,
              rx: Number(p.rx) || 0, ry: Number(p.ry) || 0, rz: Number(p.rz) || 0,
              color: p.color || "#d4d4d8",
            }))
          : [];
        if (!parts.length) throw new Error("Jabber couldn't compose that model.");
        onAdd({ name: title(res?.name || item), realSize: Number(res?.realSize) || 1.5, parts });
      }
      setPrompt("");
      onClose();
    } catch (e) {
      setErr(e.message || "Jabber couldn't generate that.");
    } finally {
      setBusy(false);
    }
  };

  const Mode = ({ id, icon: Icon, label, desc }) => (
    <button
      onClick={() => setBuildMode(id)}
      className={`flex flex-1 items-start gap-2 rounded-xl border p-3 text-left transition-colors ${buildMode === id ? "border-primary bg-primary/5" : "border-border/60 hover:border-foreground/40"}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 ${buildMode === id ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
      <span>
        <span className="block text-xs font-medium">{label}</span>
        <span className="block text-[10px] text-muted-foreground">{desc}</span>
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-border/60 bg-background shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/40 bg-background px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            <h3 className="font-heading text-sm font-bold">Generate 3D Model</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Describe anything and Jabber builds a true 3D model — real meshes you can orbit, move, scale, paint, and (in Mesh mode) sculpt. No flat images.
          </p>

          <div className="flex gap-2">
            <Mode id="composite" icon={Boxes} label="Composite" desc="Multi-part · paintable" />
            <Mode id="mesh" icon={Box} label="Mesh" desc="Single · sculptable" />
          </div>

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
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : buildMode === "mesh" ? <Box className="h-4 w-4" /> : <Boxes className="h-4 w-4" />}
            {busy ? "Generating model…" : "Generate & Add"}
          </button>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {buildMode === "mesh" ? "Single sculptable mesh · sized to real life" : "Multi-part mesh assembly · sized to real life"}
          </p>
        </div>
      </div>
    </div>
  );
}