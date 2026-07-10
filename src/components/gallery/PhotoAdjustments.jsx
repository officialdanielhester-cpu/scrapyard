import React from "react";
import { RotateCcw, RotateCw, FlipHorizontal, FlipVertical } from "lucide-react";

function Slider({ label, value, min = -100, max = 100, step = 1, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-[10px] text-foreground/70">{value > 0 ? "+" : ""}{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div className="space-y-2.5">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/80">{title}</h4>
      {children}
    </div>
  );
}

const smallBtn = "flex flex-1 items-center justify-center gap-1.5 rounded-md border py-2 text-xs transition-colors hover:border-primary hover:text-primary";

export default function PhotoAdjustments({ adj, onChange, onRotate, onFlip, onReset }) {
  const set = (key) => (v) => onChange({ [key]: v });
  return (
    <div className="space-y-5 rounded-2xl border border-border/50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Develop</h3>
        <button onClick={onReset} className="text-[10px] text-muted-foreground transition-colors hover:text-primary">Reset</button>
      </div>

      <Group title="Light">
        <Slider label="Exposure" value={adj.exposure} onChange={set("exposure")} />
        <Slider label="Contrast" value={adj.contrast} onChange={set("contrast")} />
        <Slider label="Highlights" value={adj.highlights} onChange={set("highlights")} />
        <Slider label="Shadows" value={adj.shadows} onChange={set("shadows")} />
        <Slider label="Whites" value={adj.whites} onChange={set("whites")} />
        <Slider label="Blacks" value={adj.blacks} onChange={set("blacks")} />
      </Group>

      <Group title="Color">
        <Slider label="Temperature" value={adj.temperature} onChange={set("temperature")} />
        <Slider label="Tint" value={adj.tint} onChange={set("tint")} />
        <Slider label="Vibrance" value={adj.vibrance} onChange={set("vibrance")} />
        <Slider label="Saturation" value={adj.saturation} onChange={set("saturation")} />
      </Group>

      <Group title="Effects">
        <Slider label="Clarity" value={adj.clarity} onChange={set("clarity")} />
        <Slider label="Vignette" value={adj.vignette} onChange={set("vignette")} />
        <Slider label="Grain" value={adj.grain} onChange={set("grain")} />
      </Group>

      <Group title="Transform">
        <Slider label="Straighten" value={adj.straighten} min={-45} max={45} onChange={set("straighten")} />
        <div className="flex items-center gap-2">
          <button onClick={() => onRotate(-1)} className={smallBtn}><RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} /> 90°</button>
          <button onClick={() => onRotate(1)} className={smallBtn}><RotateCw className="h-3.5 w-3.5" strokeWidth={1.5} /> 90°</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onFlip("h")} className={`${smallBtn} ${adj.flipH ? "border-primary text-primary" : "border-border/60"}`}><FlipHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} /> Flip H</button>
          <button onClick={() => onFlip("v")} className={`${smallBtn} ${adj.flipV ? "border-primary text-primary" : "border-border/60"}`}><FlipVertical className="h-3.5 w-3.5" strokeWidth={1.5} /> Flip V</button>
        </div>
      </Group>
    </div>
  );
}