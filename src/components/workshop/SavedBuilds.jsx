import React from "react";
import { Hammer, Trash2, Upload, Activity } from "lucide-react";
import { VEHICLES } from "@/components/environment/presets";

const G = 9.81;

export default function SavedBuilds({ builds, loading, onLoad, onDelete }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Hammer className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Saved Builds</h3>
      </div>
      {loading ? (
        <div className="flex h-24 items-center justify-center rounded-2xl border border-border/50">
          <Activity className="h-4 w-4 animate-pulse text-muted-foreground" />
        </div>
      ) : builds.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-6 text-center">
          <Hammer className="h-5 w-5 text-muted-foreground/50" strokeWidth={1} />
          <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">No builds saved</p>
        </div>
      ) : (
        <div className="space-y-2">
          {builds.map((b) => (
            <div key={b.id} className="flex items-center gap-2 rounded-xl border border-border/50 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{b.name}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                  {VEHICLES[b.vehicle_type]?.label || b.vehicle_type} · TWR{" "}
                  {(b.thrust / (Math.max(0.1, b.mass) * G)).toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => onLoad(b)}
                className="rounded-full border border-border/60 p-1.5 transition-colors hover:border-primary hover:text-primary"
                aria-label="Load build"
              >
                <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => onDelete(b.id)}
                className="text-muted-foreground transition-colors hover:text-destructive"
                aria-label="Delete build"
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}