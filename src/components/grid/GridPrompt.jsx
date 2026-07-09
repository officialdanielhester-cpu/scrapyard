import React, { useState } from "react";
import { ArrowUp, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GEOMETRIES = ["box", "octahedron", "icosahedron", "tetrahedron", "dodecahedron", "torus", "sphere", "cone"];

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    geometry: { type: "string", enum: GEOMETRIES },
    color: { type: "string" },
    scale: { type: "number" },
    rotX: { type: "number" },
    rotY: { type: "number" },
    rotZ: { type: "number" },
    metalness: { type: "number" },
    roughness: { type: "number" },
  },
  required: ["name", "geometry", "color", "scale", "rotX", "rotY", "rotZ", "metalness", "roughness"],
};

const clamp = (v, min, max, fallback) =>
  typeof v === "number" && !Number.isNaN(v) ? Math.max(min, Math.min(max, v)) : fallback;

const sanitizeColor = (c) => {
  if (typeof c === "string" && /^#?[0-9a-fA-F]{6}$/.test(c)) {
    return c.startsWith("#") ? c : "#" + c;
  }
  return "#3B82F6";
};

export default function GridPrompt({ onCreated }) {
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
      const params = await base44.integrations.Core.InvokeLLM({
        prompt: `You are Jabber, a 3D model designer inside an ambient intelligence app. The user said: "${text}". Design ONE 3D model as JSON. Choose the most fitting geometry from [box, octahedron, icosahedron, tetrahedron, dodecahedron, torus, sphere, cone]. Pick a hex color (e.g. #3B82F6) that matches the concept. scale between 0.5 and 2.0. rotX, rotY, rotZ in radians between -3.14 and 3.14. metalness between 0 and 1. roughness between 0 and 1. name: a short evocative title, max 4 words. Return only the JSON.`,
        response_json_schema: SCHEMA,
      });

      const geometry = GEOMETRIES.includes(params.geometry) ? params.geometry : "box";
      await base44.entities.Model.create({
        name: (params.name || text.slice(0, 24)).slice(0, 48),
        prompt: text,
        geometry,
        color: sanitizeColor(params.color),
        scale: clamp(params.scale, 0.4, 2.2, 1),
        rotX: clamp(params.rotX, -Math.PI, Math.PI, 0),
        rotY: clamp(params.rotY, -Math.PI, Math.PI, 0),
        rotZ: clamp(params.rotZ, -Math.PI, Math.PI, 0),
        metalness: clamp(params.metalness, 0, 1, 0.65),
        roughness: clamp(params.roughness, 0, 1, 0.22),
        image_url: "",
      });

      setPrompt("");
      onCreated && onCreated();
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
          placeholder="e.g. a crystalline spire humming with cold light, or a liquid-metal orchid blooming in zero gravity…"
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