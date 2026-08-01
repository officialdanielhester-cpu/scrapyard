import React, { useState } from "react";
import { Ruler, Eye, EyeOff } from "lucide-react";

const UNITS = { cm: 1, in: 2.54, mm: 0.1 };

export default function MeasurementsPanel({ template, state, onChange, showGuides, onToggleGuides }) {
  const [unit, setUnit] = useState("cm");
  const ms = state.measurements || {};

  const setMeasure = (key, raw) => {
    onChange({ measurements: { ...ms, [key]: raw } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ruler className="h-4 w-4 text-primary" strokeWidth={1.5} />
          <h3 className="font-heading text-sm font-bold">Measurements</h3>
        </div>
        <div className="flex items-center gap-1">
          {Object.keys(UNITS).map((u) => (
            <button key={u} onClick={() => setUnit(u)} className={`rounded-md px-2 py-0.5 text-[10px] font-mono ${unit === u ? "bg-primary text-white" : "text-muted-foreground"}`}>{u}</button>
          ))}
        </div>
      </div>

      <button onClick={onToggleGuides} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
        {showGuides ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        {showGuides ? "Hide guides" : "Show measurement guides"}
      </button>

      <div className="space-y-3">
        {Object.entries(template.measurements).map(([key, def]) => {
          const val = ms[key] ?? def.default;
          const display = (val * UNITS[unit] / UNITS.cm).toFixed(unit === "mm" ? 0 : 1);
          const min = def.min * UNITS[unit] / UNITS.cm;
          const max = def.max * UNITS[unit] / UNITS.cm;
          return (
            <div key={key}>
              <label className="mb-0.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>{def.label}</span><span className="text-foreground/70">{display} {unit}</span>
              </label>
              <input type="range" min={def.min} max={def.max} step={(def.max - def.min) / 100} value={val} onChange={(e) => setMeasure(key, +e.target.value)} className="w-full accent-[#a855f7]" />
            </div>
          );
        })}
      </div>
    </div>
  );
}