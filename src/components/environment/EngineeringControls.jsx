import React from "react";
import { Wrench, SlidersHorizontal, Layers } from "lucide-react";

const ENGINEERING = [
  { key: "thrust", label: "Thrust", unit: "kN", min: 0, max: 200, step: 1 },
  { key: "mass", label: "Mass", unit: "t", min: 1, max: 50, step: 1 },
  { key: "drag", label: "Drag Coef", unit: "", min: 0, max: 2, step: 0.05 },
  { key: "lift", label: "Lift Coef", unit: "", min: 0, max: 3, step: 0.05 },
  { key: "fuel", label: "Fuel Load", unit: "s", min: 0, max: 60, step: 1 },
];

const CUSTOM_ENV = [
  { key: "gravity", label: "Gravity", unit: "m/s²", min: 0, max: 20, step: 0.1 },
  { key: "atmosphere", label: "Atmosphere", unit: "×", min: 0, max: 3, step: 0.05 },
  { key: "temperature", label: "Temperature", unit: "°C", min: -270, max: 500, step: 1 },
  { key: "wind", label: "Wind", unit: "m/s", min: -20, max: 20, step: 0.5 },
];

function decimals(step) {
  if (step >= 1) return 0;
  if (step >= 0.1) return 1;
  return 2;
}

function Slider({ item, value, onChange }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-foreground/80">{item.label}</span>
        <span className="font-mono text-xs text-primary">
          {Number(value).toFixed(decimals(item.step))}
          {item.unit}
        </span>
      </div>
      <input
        type="range"
        min={item.min}
        max={item.max}
        step={item.step}
        value={value}
        onChange={(e) => onChange(item.key, parseFloat(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

export default function EngineeringControls({ params, onParam, variables, onVariable, envKey, launchAngle, onLaunchAngle, launchLabel }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Engineering</h3>
        </div>
        <div className="space-y-4 rounded-2xl border border-border/50 p-4">
          <Slider
            item={{ key: "launchAngle", label: launchLabel || "Launch Angle", unit: "°", min: -45, max: 90, step: 1 }}
            value={launchAngle ?? 0}
            onChange={(k, val) => onLaunchAngle?.(val)}
          />
          {ENGINEERING.map((item) => (
            <Slider key={item.key} item={item} value={params[item.key]} onChange={onParam} />
          ))}
        </div>
      </div>

      {envKey === "custom" && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">World Tuning</h3>
          </div>
          <div className="space-y-4 rounded-2xl border border-border/50 p-4">
            {CUSTOM_ENV.map((item) => (
              <Slider key={item.key} item={item} value={variables[item.key]} onChange={onVariable} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-2xl border border-border/50 p-4">
        <Slider
          item={{ key: "timeScale", label: "Time Flow", unit: "×", min: 0, max: 3, step: 0.1 }}
          value={variables.timeScale}
          onChange={onVariable}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-foreground/80">Backdrop</span>
          <input
            type="color"
            value={variables.bgColor}
            onChange={(e) => onVariable("bgColor", e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border/60 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}