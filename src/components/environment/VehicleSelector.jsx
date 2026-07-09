import React from "react";
import { Rocket, Plane, Car, Truck, Crosshair, Wind } from "lucide-react";
import { VEHICLES } from "@/components/environment/presets";

const ICONS = { Rocket, Plane, Car, Truck, Crosshair, Wind };

const CATEGORY_TAG = {
  launch: "Aerospace",
  winged: "Aviation",
  rotor: "Rotorcraft",
  ground: "Ground",
};

export default function VehicleSelector({ value, onSelect }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Rocket className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Vehicle</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(VEHICLES).map(([key, v]) => {
          const Icon = ICONS[v.icon] || Rocket;
          const active = value === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-colors ${
                active ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
              <span className="text-xs font-medium text-foreground">{v.label}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                {CATEGORY_TAG[v.category]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}