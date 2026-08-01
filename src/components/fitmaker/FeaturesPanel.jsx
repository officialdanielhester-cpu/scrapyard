import React from "react";
import { Wand2, Upload, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FeaturesPanel({ template, state, onChange }) {
  const enabled = state.features || [];
  const toggle = (id) => onChange({ features: enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id] });

  const onPattern = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ patternUrl: res?.file_url || res });
    } catch { /* ignore */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Wand2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h3 className="font-heading text-sm font-bold">Features</h3>
      </div>

      {(template.features || []).length === 0 && <p className="text-xs text-muted-foreground">No optional features for this garment.</p>}
      <div className="space-y-1.5">
        {(template.features || []).map((f) => (
          <button key={f.id} onClick={() => toggle(f.id)} className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs ${enabled.includes(f.id) ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"}`}>
            <span>{f.label}</span>
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${enabled.includes(f.id) ? "border-primary bg-primary text-white" : "border-white/20"}`}>
              {enabled.includes(f.id) && <Check className="h-3 w-3" />}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-center gap-2 text-xs font-medium"><Upload className="h-3.5 w-3.5 text-primary" /> Custom Pattern</div>
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/15 px-3 py-3 text-xs text-muted-foreground hover:border-primary hover:text-primary">
          <input type="file" accept="image/*" className="hidden" onChange={onPattern} />
          {state.patternUrl ? "Pattern applied — click to replace" : "Upload an image to fill the fabric"}
        </label>
        {state.patternUrl && <button onClick={() => onChange({ patternUrl: "" })} className="w-full text-center text-[10px] text-destructive">Remove pattern</button>}
      </div>
    </div>
  );
}