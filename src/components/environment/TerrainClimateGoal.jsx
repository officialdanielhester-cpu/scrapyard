import React from "react";
import { Mountain, Cloud, Flag } from "lucide-react";
import { TERRAINS, CLIMATES, GROUND_GOALS } from "@/components/environment/presets";

function Pill({ items, value, onSelect }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(items).map(([key, obj]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            value === key ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-foreground/80 hover:border-primary/50"
          }`}
        >
          {obj.label}
        </button>
      ))}
    </div>
  );
}

// Terrain / Climate / Goal selector for ground vehicles.
export default function TerrainClimateGoal({ terrain, climate, goal, onTerrain, onClimate, onGoal }) {
  return (
    <div className="space-y-4 rounded-2xl border border-border/50 p-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Mountain className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Terrain</h3>
        </div>
        <Pill items={TERRAINS} value={terrain} onSelect={onTerrain} />
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Cloud className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Climate</h3>
        </div>
        <Pill items={CLIMATES} value={climate} onSelect={onClimate} />
      </div>
      <div>
        <div className="mb-2 flex items-center gap-2">
          <Flag className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Goal</h3>
        </div>
        <Pill items={GROUND_GOALS} value={goal} onSelect={onGoal} />
      </div>
    </div>
  );
}