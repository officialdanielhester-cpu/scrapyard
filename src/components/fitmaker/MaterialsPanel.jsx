import React from "react";
import { Layers } from "lucide-react";
import { MATERIALS } from "@/components/fitmaker/materials";

export default function MaterialsPanel({ state, onChange }) {
  const mat = MATERIALS.find((m) => m.id === state.material) || MATERIALS[0];
  const props = { ...mat, ...(state.materialProps || {}) };

  const setMat = (id) => onChange({ material: id, materialProps: {} });
  const setProp = (k, v) => onChange({ materialProps: { ...state.materialProps, [k]: v } });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h3 className="font-heading text-sm font-bold">Materials</h3>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {MATERIALS.map((m) => (
          <button key={m.id} onClick={() => setMat(m.id)} className={`rounded-lg border px-3 py-2 text-left text-xs ${state.material === m.id ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
            <span className="font-medium">{m.name}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-3">
        <PropSlider label="Texture" value={props.texture} min={0} max={1} step={0.01} onChange={(v) => setProp("texture", v)} />
        <PropSlider label="Thickness" value={props.weight} min={0} max={1} step={0.01} onChange={(v) => setProp("weight", v)} />
        <PropSlider label="Reflectivity" value={props.reflectivity} min={0} max={1} step={0.01} onChange={(v) => setProp("reflectivity", v)} />
        <PropSlider label="Roughness" value={props.roughness} min={0} max={1} step={0.01} onChange={(v) => setProp("roughness", v)} />
        <PropSlider label="Transparency" value={props.transparency} min={0} max={0.8} step={0.01} onChange={(v) => setProp("transparency", v)} />
        <PropSlider label="Stretch" value={(state.materialProps?.stretch) ?? 0.5} min={0} max={1} step={0.01} onChange={(v) => setProp("stretch", v)} />
      </div>
    </div>
  );
}

function PropSlider({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <label className="mb-0.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>{label}</span><span className="text-foreground/60">{Math.round((value || 0) * 100)}%</span></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[#a855f7]" />
    </div>
  );
}