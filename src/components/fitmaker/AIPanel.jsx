import React, { useState } from "react";
import { Sparkles, Wand2, Image as ImageIcon, TrendingUp, RefreshCw, Loader2, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

const DESIGN_SCHEMA = {
  type: "object",
  properties: {
    color: { type: "string" },
    color2: { type: "string" },
    finish: { type: "string", enum: ["matte", "gloss", "metallic"] },
    material: { type: "string", enum: ["cotton","denim","leather","wool","polyester","nylon","satin","silk","linen","canvas","mesh","velvet","fleece","suede","knit","rubber"] },
    description: { type: "string" },
    features: { type: "array", items: { type: "string" } },
    palette: { type: "array", items: { type: "string" } },
  },
  required: ["color", "material", "description"],
};

const VARIATIONS_SCHEMA = {
  type: "object",
  properties: {
    variations: { type: "array", items: { type: "object", properties: { color: { type: "string" }, material: { type: "string" }, finish: { type: "string" }, name: { type: "string" } }, required: ["color", "material"] } },
  },
  required: ["variations"],
};

export default function AIPanel({ template, state, onApply }) {
  const [busy, setBusy] = useState(null);
  const [concept, setConcept] = useState(null);
  const [palette, setPalette] = useState(null);
  const [tips, setTips] = useState(null);
  const [variations, setVariations] = useState(null);
  const [moodUrl, setMoodUrl] = useState(null);
  const [trends, setTrends] = useState(null);
  const [prompt, setPrompt] = useState("");

  const run = async (key, fn) => { setBusy(key); try { await fn(); } finally { setBusy(null); } };

  const genConcept = () => run("concept", async () => {
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a luxury fashion design AI. Generate a striking concept for a ${template.name}. Be bold, modern, premium. Return a color (hex), optional secondary color2 (hex) for gradient, finish, fabric material id, a short evocative description, and any feature ids to enable from: ${JSON.stringify(template.features.map((f) => f.id))}. Also return a 5-color palette of complementary hex colors.\n\nUser direction: ${prompt || "surprise me"}`,
      response_json_schema: DESIGN_SCHEMA,
    });
    setConcept(r);
  });

  const suggestPalette = () => run("palette", async () => {
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Suggest a 5-color luxury fashion palette that pairs well with a ${template.name} in ${state.color}. Return as JSON { colors: [hex...] }.`,
      response_json_schema: { type: "object", properties: { colors: { type: "array", items: { type: "string" } } }, required: ["colors"] },
    });
    setPalette(r?.colors || []);
  });

  const suggestImprove = () => run("improve", async () => {
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a fashion design mentor. The user designed a ${template.name} in ${state.color} (${state.finish}, ${state.material}). Features: ${(state.features || []).join(", ")}. Give 3 concise, specific suggestions to elevate the design (style, color, materials, detailing). Return JSON { tips: [string, string, string] }.`,
      response_json_schema: { type: "object", properties: { tips: { type: "array", items: { type: "string" } } }, required: ["tips"] },
    });
    setTips(r?.tips || []);
  });

  const genVariations = () => run("variations", async () => {
    const r = await base44.integrations.Core.InvokeLLM({
      prompt: `Create 3 distinct design variations for a ${template.name} (currently ${state.color}, ${state.material}). Each variation: name, color (hex), material id, finish. Make them visibly different moods. Return JSON matching the schema.`,
      response_json_schema: VARIATIONS_SCHEMA,
    });
    setVariations(r?.variations || []);
  });

  const moodBoard = () => run("mood", async () => {
    setMoodUrl(null);
    const r = await base44.integrations.Core.GenerateImage({ prompt: `A luxury fashion mood board, editorial photography, ${template.name} design inspiration, ${prompt || "modern avant-garde"}, rich textures, magazine layout aesthetic, dark purple accents` });
    setMoodUrl(r?.url || r);
  });

  const trendsAI = () => run("trends", async () => {
    const r = await base44.integrations.Core.InvokeLLM({ prompt: `What are the current trending fashion design directions and silhouettes this season? Give 4 concise trends with a styling idea for a ${template.name}.`, add_context_from_internet: true, model: "gemini_3_flash" });
    setTrends((typeof r === "string" ? r : r?.reply || "").trim());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h3 className="font-heading text-sm font-bold">AI Studio</h3>
      </div>

      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe a concept, mood, or direction…" rows={2} className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-primary" />

      <div className="grid grid-cols-2 gap-2">
        <AIButton icon={Wand2} label="Concept" busy={busy === "concept"} onClick={genConcept} />
        <AIButton icon={RefreshCw} label="Variations" busy={busy === "variations"} onClick={genVariations} />
        <AIButton icon={Sparkles} label="Palette" busy={busy === "palette"} onClick={suggestPalette} />
        <AIButton icon={TrendingUp} label="Trends" busy={busy === "trends"} onClick={trendsAI} />
        <AIButton icon={ImageIcon} label="Mood board" busy={busy === "mood"} onClick={moodBoard} />
        <AIButton icon={Sparkles} label="Improve" busy={busy === "improve"} onClick={suggestImprove} />
      </div>

      {concept && (
        <Card title="Generated Concept">
          <p className="text-xs text-foreground/80">{concept.description}</p>
          <button onClick={() => onApply({ color: concept.color, color2: concept.color2 || "", gradient: !!concept.color2, finish: concept.finish, material: concept.material, features: concept.features || state.features })} className="mt-2 w-full rounded-lg bg-primary py-2 text-xs font-medium text-white hover:opacity-90">Apply to design</button>
        </Card>
      )}
      {palette && (
        <Card title="Suggested Palette">
          <div className="flex gap-1.5">
            {palette.map((c) => <button key={c} onClick={() => onApply({ color: c })} className="h-8 flex-1 rounded-md border border-white/10" style={{ background: c }} title={c} />)}
          </div>
        </Card>
      )}
      {tips && <Card title="Suggestions">{tips.map((t, i) => <p key={i} className="mb-1 text-xs text-foreground/80">· {t}</p>)}</Card>}
      {variations && (
        <Card title="Variations">
          {variations.map((v, i) => (
            <button key={i} onClick={() => onApply({ color: v.color, material: v.material, finish: v.finish || state.finish })} className="mb-1.5 flex w-full items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-left hover:border-primary">
              <span className="h-5 w-5 rounded border border-white/10" style={{ background: v.color }} />
              <span className="text-xs">{v.name} · {v.material}</span>
              <Check className="ml-auto h-3 w-3 text-primary" />
            </button>
          ))}
        </Card>
      )}
      {moodUrl && <Card title="Mood Board"><img src={moodUrl} alt="mood board" className="w-full rounded-lg" /></Card>}
      {trends && <Card title="Trend Inspiration"><pre className="whitespace-pre-wrap font-body text-xs text-foreground/80">{trends}</pre></Card>}
    </div>
  );
}

function AIButton({ icon: Icon, label, onClick, busy }) {
  return (
    <button onClick={onClick} disabled={busy} className="flex items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-2.5 text-xs text-muted-foreground transition-all hover:border-primary hover:text-primary disabled:opacity-50">
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}{label}
    </button>
  );
}
function Card({ title, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}