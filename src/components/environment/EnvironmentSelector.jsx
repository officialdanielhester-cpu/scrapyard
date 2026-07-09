import React from "react";
import { Globe } from "lucide-react";
import { ENVIRONMENTS } from "@/components/environment/presets";

export default function EnvironmentSelector({ value, onSelect }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Globe className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Environment</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(ENVIRONMENTS).map(([key, e]) => {
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-2.5 transition-colors ${
                active ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50"
              }`}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: e.bgColor }} />
              <span className={`text-[11px] font-medium ${active ? "text-primary" : "text-foreground/80"}`}>
                {e.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}