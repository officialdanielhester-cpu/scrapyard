import React from "react";
import { Palette, Sparkles, Check } from "lucide-react";
import { FINISHES } from "@/components/fitmaker/materials";

const PRESETS = ["#a855f7", "#7c3aed", "#6d28d9", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#0ea5e9", "#1f2937", "#f8fafc", "#000000"];

function hexToRgb(h) {
  const m = h?.replace("#", "");
  if (!m || m.length !== 6) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(m.slice(0, 2), 16), g: parseInt(m.slice(2, 4), 16), b: parseInt(m.slice(4, 6), 16) };
}
function rgbToHex(r, g, b) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export default function ColorStudio({ state, onChange }) {
  const rgb = hexToRgb(state.color);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const setHex = (hex) => onChange({ color: hex });
  const setHsl = (h, s, l) => {
    // hsl → rgb → hex
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const a = s * Math.min(l, 100 - l) / 100;
      const c = l / 100 - a / 2;
      return Math.round((c + a * Math.max(-1, Math.min(k - 3, 9 - k))) * 255);
    };
    onChange({ color: rgbToHex(f(0), f(8), f(4)) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Palette className="h-4 w-4 text-primary" strokeWidth={1.5} />
        <h3 className="font-heading text-sm font-bold">Color Studio</h3>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-14 w-14 shrink-0 rounded-xl border border-white/10 shadow-lg" style={{ background: state.gradient && state.color2 ? `linear-gradient(135deg, ${state.color}, ${state.color2})` : state.color }} />
        <div className="flex-1">
          <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">HEX</label>
          <input value={state.color} onChange={(e) => setHex(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm outline-none focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {PRESETS.map((c) => (
          <button key={c} onClick={() => setHex(c)} className="aspect-square rounded-lg border border-white/10 transition-transform hover:scale-110" style={{ background: c }} title={c}>
            {state.color.toLowerCase() === c.toLowerCase() && <Check className="mx-auto h-3 w-3 text-white mix-blend-difference" />}
          </button>
        ))}
      </div>

      <Slider label="Hue" value={Math.round(hsl.h)} min={0} max={360} onChange={(v) => setHsl(v, hsl.s, hsl.l)} />
      <Slider label="Saturation" value={Math.round(hsl.s)} min={0} max={100} onChange={(v) => setHsl(hsl.h, v, hsl.l)} />
      <Slider label="Lightness" value={Math.round(hsl.l)} min={0} max={100} onChange={(v) => setHsl(hsl.h, hsl.s, v)} />

      <div>
        <label className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>RGB</span>
          <span className="text-foreground/60">{rgb.r} · {rgb.g} · {rgb.b}</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {["r", "g", "b"].map((k) => (
            <input key={k} type="number" min={0} max={255} value={rgb[k]} onChange={(e) => onChange({ color: rgbToHex(k === "r" ? +e.target.value : rgb.r, k === "g" ? +e.target.value : rgb.g, k === "b" ? +e.target.value : rgb.b) })}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-xs outline-none focus:border-primary" />
          ))}
        </div>
      </div>

      <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <span className="text-xs font-medium">Gradient</span>
        <input type="checkbox" checked={!!state.gradient} onChange={(e) => onChange({ gradient: e.target.checked })} className="accent-[#a855f7]" />
      </label>
      {state.gradient && (
        <div className="flex items-center gap-2">
          <input type="color" value={state.color2 || "#7c3aed"} onChange={(e) => onChange({ color2: e.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border border-white/10 bg-transparent" />
          <span className="font-mono text-xs text-muted-foreground">Second color</span>
        </div>
      )}

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><Sparkles className="h-3 w-3" /> Finish</label>
        <div className="grid grid-cols-3 gap-2">
          {FINISHES.map((f) => (
            <button key={f.id} onClick={() => onChange({ finish: f.id })} className={`rounded-lg border px-2 py-2 text-xs ${state.finish === f.id ? "border-primary bg-primary/15 text-primary" : "border-white/10 text-muted-foreground hover:text-foreground"}`}>{f.name}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange }) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground"><span>{label}</span><span className="text-foreground/60">{value}</span></label>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-[#a855f7]" />
    </div>
  );
}