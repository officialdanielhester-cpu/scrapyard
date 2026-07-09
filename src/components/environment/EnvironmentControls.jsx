import React from "react";
import { Gauge, Wind, Thermometer, Cog, Layers } from "lucide-react";

const GROUPS = [
  {
    title: "Physics",
    icon: Gauge,
    items: [
      { key: "gravity", label: "Gravity", unit: "m/s²", min: 0, max: 20, step: 0.1 },
      { key: "friction", label: "Friction", unit: "", min: 0, max: 0.95, step: 0.05 },
      { key: "timeScale", label: "Time Flow", unit: "×", min: 0, max: 3, step: 0.1 },
    ],
  },
  {
    title: "Environment",
    icon: Wind,
    items: [
      { key: "wind", label: "Wind Force", unit: "m/s", min: -20, max: 20, step: 0.5 },
      { key: "atmosphere", label: "Atmosphere", unit: "×", min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    title: "Thermal",
    icon: Thermometer,
    items: [
      { key: "temperature", label: "Temperature", unit: "°C", min: -50, max: 200, step: 1 },
    ],
  },
  {
    title: "Mechanics",
    icon: Cog,
    items: [
      { key: "specimens", label: "Specimens", unit: "", min: 1, max: 8, step: 1 },
    ],
  },
];

function decimals(step) {
  if (step >= 1) return 0;
  if (step >= 0.1) return 1;
  return 2;
}

export default function EnvironmentControls({ variables, onChange }) {
  return (
    <div className="space-y-6">
      {GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title}>
            <div className="mb-3 flex items-center gap-2">
              <Icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
              <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {group.title}
              </h3>
            </div>
            <div className="space-y-4 rounded-2xl border border-border/50 p-4">
              {group.items.map((item) => {
                const val = variables[item.key];
                return (
                  <div key={item.key}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs text-foreground/80">{item.label}</span>
                      <span className="font-mono text-xs text-primary">
                        {Number(val).toFixed(decimals(item.step))}
                        {item.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      value={val}
                      onChange={(e) => onChange(item.key, parseFloat(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Backdrop</h3>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border/50 p-4">
          <span className="text-xs text-foreground/80">Background</span>
          <input
            type="color"
            value={variables.bgColor}
            onChange={(e) => onChange("bgColor", e.target.value)}
            className="h-8 w-12 cursor-pointer rounded border border-border/60 bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}