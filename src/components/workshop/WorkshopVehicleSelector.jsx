import React from "react";
import { Rocket, Crosshair, Plane, Wind, Car, Truck } from "lucide-react";
import { VEHICLES } from "@/components/environment/presets";

const ICONS = { Rocket, Crosshair, Plane, Wind, Car, Truck };
const CAT_LABEL = { launch: "Launch", winged: "Aviation", rotor: "Rotorcraft", ground: "Ground" };

export default function WorkshopVehicleSelector({ value, onSelect }) {
  return (
    <div>
      <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Vehicle</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(VEHICLES).map(([id, v]) => {
          const Icon = ICONS[v.icon] || Rocket;
          const active = id === value;
          return (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                active ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{v.label}</p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{CAT_LABEL[v.category]}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}