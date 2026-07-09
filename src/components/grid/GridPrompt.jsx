import React, { useState } from "react";
import { ArrowUp, Sparkles, Loader2, Square, Box as BoxIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

const GEOMETRIES = ["box", "octahedron", "icosahedron", "tetrahedron", "dodecahedron", "torus", "sphere", "cone"];

const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    image_prompt: { type: "string" },
    geometry: { type: "string", enum: GEOMETRIES },
    color: { type: "string" },
    scale: { type: "number" },
    rotX: { type: "number" },
    rotY: { type: "number" },
    rotZ: { type: "number" },
    metalness: { type: "number" },
    roughness: { type: "number" },
  },
  required: ["name", "image_prompt", "geometry", "color", "scale", "rotX", "rotY", "rotZ", "metalness", "roughness"],
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
      const is3D = mode === "3d";
      const designPrompt = `You are Jabber, a model designer in an ambient intelligence app. The user wants a ${is3D ? "3D" : "2D"} model: "${text}".
Return JSON with:
- name: a short evocative title (max 4 words)
- image_prompt: a detailed visual description for an AI image generator depicting this exact object. Style: clean studio render, centered, dark background, no text, no watermark.${is3D ? " Suitable for wrapping onto a 3D surface." : ""}
${is3D ? `- geometry: best fit from [${GEOMETRIES.join(", ")}]
- color: hex color (e.g. #3B82F6)
- scale: 0.5 to 2.0
- rotX, rotY, rotZ: radians between -3.14 and 3.14
- metalness: 0 to 1
- roughness: 0 to 1` : `- geometry: "box"
- color: "#FFFFFF"
- scale: 1
- rotX: 0, rotY: 0, rotZ: 0
- metalness: 0, roughness: 1`}
Return only the JSON.`;

      const params = await base44.integrations.Core.InvokeLLM({
        prompt: designPrompt,
        response_json_schema: SCHEMA,
      });

      const img = await base44.integrations.Core.GenerateImage({ prompt: params.image_prompt });
      const imgUrl = img?.url || img;

      const geometry = is3D ? (GEOMETRIES.includes(params.geometry) ? params.geometry : "box") : "plane";
      await base44.entities.Model.create({
        name: (params.name || text.slice(0, 24)).slice(0, 48),
        prompt: text,
        mode,
        image_url: imgUrl,
        geometry,
        color: sanitizeColor(params.color),
        scale: clamp(params.scale, 0.4, 2.2, 1),
        rotX: clamp(params.rotX, -Math.PI, Math.PI, 0),
        rotY: clamp(params.rotY, -Math.PI, Math.PI, 0),
        rotZ: clamp(params.rotZ, -Math.PI, Math.PI, 0),
        metalness: clamp(params.metalness, 0, 1, 0.65),
        roughness: clamp(params.roughness, 0, 1, 0.22),
        markup: [],
      });

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