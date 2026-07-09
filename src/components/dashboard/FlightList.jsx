import React from "react";
import { Activity } from "lucide-react";
import { VEHICLES, ENVIRONMENTS } from "@/components/environment/presets";

export default function FlightList({ experiments, loading, selectedId, onSelect }) {
  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl border border-border/50">
        <Activity className="h-4 w-4 animate-pulse text-muted-foreground" />
      </div>
    );
  }
  if (!experiments.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-8 text-center">
        <Activity className="h-6 w-6 text-muted-foreground/50" strokeWidth={1} />
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">No test flights</p>
        <p className="mt-1 text-xs text-muted-foreground/70">Record a flight in Environment</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {experiments.map((exp) => {
        const active = exp.id === selectedId;
        return (
          <button
            key={exp.id}
            onClick={() => onSelect(exp.id)}
            className={`w-full rounded-xl border p-3 text-left transition-colors ${
              active ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-medium text-foreground">{exp.name}</p>
              <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {ENVIRONMENTS[exp.environment]?.label || exp.environment}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {VEHICLES[exp.vehicle_type]?.label || exp.vehicle_type}
            </p>
            <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px]">
              <span className="text-primary">{Number(exp.maxAltitude).toFixed(0)}m</span>
              <span className="text-muted-foreground">{Number(exp.maxVelocity).toFixed(0)}m/s</span>
              <span className="text-muted-foreground">{Number(exp.flightTime).toFixed(0)}s</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}